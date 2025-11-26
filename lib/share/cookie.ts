import crypto from 'crypto';
import { cookies } from 'next/headers';

export type CookieStore = Awaited<ReturnType<typeof cookies>>;
export type CookieStoreLike = CookieStore | PromiseLike<CookieStore>;

import {
  SHARE_ATTRIBUTION_COOKIE,
  SHARE_ATTRIBUTION_COOKIE_MAX_AGE,
  SHARE_ATTRIBUTION_COOKIE_SECRET_ENV,
} from './constants';

type ShareAttributionMode = "job" | "invite";

type ShareAttributionBase = {
  jobId: string | null;
  ownerId: string;
  shareSlug: string;
  locale?: string;
  source?: string;
  mode?: ShareAttributionMode;
};

export type ShareAttributionPayload = ShareAttributionBase & {
  issuedAt: number;
  expiresAt: number;
};

function getSecret(): string {
  const secret = process.env[SHARE_ATTRIBUTION_COOKIE_SECRET_ENV];
  if (!secret) {
    throw new Error(
      `Missing ${SHARE_ATTRIBUTION_COOKIE_SECRET_ENV} environment variable for share attribution cookie`
    );
  }
  return secret;
}

function encodePayload(payload: ShareAttributionPayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodePayload(raw: string): ShareAttributionPayload | null {
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return parsed as ShareAttributionPayload;
  } catch {
    return null;
  }
}

function sign(data: string) {
  const secret = getSecret();
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

function signPayload(payload: ShareAttributionPayload) {
  const encoded = encodePayload(payload);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

function verifyToken(token: string): ShareAttributionPayload | null {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) {
    return null;
  }

  const expectedSignature = sign(encoded);
  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(received, expected)) {
    return null;
  }

  const payload = decodePayload(encoded);
  if (!payload) {
    return null;
  }

  if (payload.expiresAt < Date.now()) {
    return null;
  }

  return {
    ...payload,
    jobId: payload.jobId ?? null,
    mode: (payload.mode ?? "job") as ShareAttributionMode,
  };
}

async function getCookieStore(store?: CookieStoreLike) {
  if (store) return store;
  return cookies();
}

export async function setShareAttributionCookie(
  basePayload: ShareAttributionBase,
  options?: { maxAge?: number; store?: CookieStoreLike }
) {
  const maxAge = options?.maxAge ?? SHARE_ATTRIBUTION_COOKIE_MAX_AGE;
  const now = Date.now();
  const mode: ShareAttributionMode =
    basePayload.mode ?? (basePayload.jobId ? "job" : "invite");
  const payload: ShareAttributionPayload = {
    jobId: basePayload.jobId ?? null,
    ownerId: basePayload.ownerId,
    shareSlug: basePayload.shareSlug,
    locale: basePayload.locale,
    source: basePayload.source,
    mode,
    issuedAt: now,
    expiresAt: now + maxAge * 1000,
  };

  const token = signPayload(payload);
  const cookieStore = await getCookieStore(options?.store);
  cookieStore.set({
    name: SHARE_ATTRIBUTION_COOKIE,
    value: token,
    maxAge,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function clearShareAttributionCookie(store?: CookieStoreLike) {
  const cookieStore = await getCookieStore(store);
  cookieStore.set({
    name: SHARE_ATTRIBUTION_COOKIE,
    value: '',
    maxAge: 0,
    path: '/',
  });
}

export async function getShareAttributionCookie(store?: CookieStoreLike) {
  try {
    const cookieStore = await getCookieStore(store);
    const token = cookieStore.get(SHARE_ATTRIBUTION_COOKIE)?.value;
    if (!token) {
      return null;
    }
    return verifyToken(token);
  } catch (error) {
    console.error('[share-cookie] Failed to read attribution cookie', error);
    return null;
  }
}
