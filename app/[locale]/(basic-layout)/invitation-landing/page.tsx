/**********************************************************************
 * Invitation Landing Page
 *
 * Provides a dedicated landing experience for user-level invitation
 * links like `/invitation-landing?invite_code=abc123`.
 *
 * The page resolves the inviter by `invite_code`, sets the share
 * attribution cookie in `mode: "invite"`, and renders a simple sign-up
 * call to action so invited users can register immediately.
 *********************************************************************/

import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Locale, DEFAULT_LOCALE } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { setShareAttributionCookie } from "@/lib/share/cookie";

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined> | undefined>;

function resolveInviteCode(search?: Record<string, string | string[] | undefined>) {
  const raw = search?.invite_code;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

function buildLocalePath(locale: string, path: string) {
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  return `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams?: SearchParams;
}): Promise<Metadata> {
  const [{ locale }, resolvedSearch] = await Promise.all([params, searchParams]);
  const inviteCode = resolveInviteCode(resolvedSearch);

  if (!inviteCode) {
    return constructMetadata({
      page: "InvitationLanding",
      title: "邀请注册",
      locale: locale as Locale,
      path: "/invitation-landing",
      noIndex: true,
    });
  }

  const supabase = getServiceRoleClient();
  const { data: inviter } = await supabase
    .from("users")
    .select("full_name, invite_code")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  const displayName = inviter?.full_name ?? inviter?.invite_code ?? inviteCode;

  return constructMetadata({
    page: "InvitationLanding",
    title: `${displayName} 邀请你加入`,
    description: `${displayName} 邀请你体验我们的 AI 功能，立即注册享受额外权益。`,
    locale: locale as Locale,
    path: "/invitation-landing",
  });
}

export default async function InvitationLandingPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams?: SearchParams;
}) {
  const [{ locale }, resolvedSearch] = await Promise.all([params, searchParams]);
  const inviteCode = resolveInviteCode(resolvedSearch);

  if (!inviteCode) {
    notFound();
  }

  const supabase = getServiceRoleClient();
  const { data: inviter } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, invite_code")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (!inviter) {
    notFound();
  }

  try {
    await setShareAttributionCookie(
      {
        mode: "invite",
        jobId: null,
        ownerId: inviter.id,
        shareSlug: inviter.invite_code ?? inviteCode,
        locale,
        source: "invite",
      },
      // Invitation links往往是公开访问，不需要额外的 cookie store
      undefined,
    );
  } catch (error) {
    console.error("[invitation-landing] failed to set invite cookie", error);
  }

  const displayName = inviter.full_name ?? inviter.invite_code ?? inviteCode;
  const signupUrl = `${buildLocalePath(locale, "/sign-up")}?invite_code=${encodeURIComponent(
    inviteCode,
  )}`;
  const loginUrl = `${buildLocalePath(locale, "/login")}`;

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#1c1c1a] px-4 py-16 text-white">
        <div className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-[#1c1c1a] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-lg">
                {inviter.avatar_url ? (
                  <Image
                    src={inviter.avatar_url}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff4d8d]/20 to-[#7b61ff]/20 px-5 py-2 text-sm font-medium text-white/80">
                  <span>{displayName}</span>
                  <span className="text-white/60">邀请你加入</span>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  加入我们的创作社区，领取专属体验权益
                </h1>
                <p className="text-sm text-white/60 md:text-base">
                  通过好友邀请注册，即可获得额外积分与专属模板。立即注册，解锁更多 AI 创作能力。
                </p>
              </div>
            </div>

            <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-black/20 p-6 shadow-inner">
              <Button className="h-12 w-full text-base font-semibold" asChild>
                <Link href={signupUrl}>使用邮箱或手机号注册</Link>
              </Button>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span className="h-px flex-1 bg-white/10" />
                <span>或</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <div className="flex flex-col gap-3 text-sm text-white/70">
                <Button variant="outline" className="h-12 justify-center text-base" asChild>
                  <Link href={loginUrl}>已有账号？登录继续</Link>
                </Button>
                <p className="text-xs text-white/40">
                  注册即表示同意我们的{" "}
                  <Link
                    className="text-white/70 underline decoration-white/30 underline-offset-4 hover:text-white"
                    href={buildLocalePath(locale, "/terms-of-service")}
                  >
                    使用条款
                  </Link>{" "}
                  与{" "}
                  <Link
                    className="text-white/70 underline decoration-white/30 underline-offset-4 hover:text-white"
                    href={buildLocalePath(locale, "/privacy-policy")}
                  >
                    隐私政策
                  </Link>
                  。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

  );
}
