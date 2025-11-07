import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { setShareAttributionCookie } from '@/lib/share/cookie';
import type { ShareAttributionPayload } from '@/lib/share/cookie';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<ShareAttributionPayload>;
    if (!payload || !payload.ownerId) {
      return NextResponse.json({ success: false, error: 'missing_inviter' }, { status: 400 });
    }

    await setShareAttributionCookie(
      {
        mode: payload.mode ?? 'invite',
        jobId: payload.jobId ?? null,
        ownerId: payload.ownerId,
        shareSlug: payload.shareSlug ?? '',
        locale: payload.locale,
        source: payload.source,
      },
      { store: cookies() }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[share-invite] failed to set cookie', error);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}
