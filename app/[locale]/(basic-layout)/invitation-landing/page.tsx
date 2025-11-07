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

import { InviteCookieSetter } from "@/components/invite/InviteCookieSetter";
import { InviteEmailSignup } from "@/components/invite/InviteEmailSignup";
import { Locale, DEFAULT_LOCALE } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { shareRewardConfig } from "@/config/share";

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

  const inviteDisplayName =
    (typeof inviter?.full_name === "string" && inviter.full_name.trim().length > 0)
      ? inviter.full_name.trim()
      : null;
  const inviteSlug = inviter?.invite_code ?? inviteCode;
  const inviteTitleName = inviteDisplayName ?? inviteSlug;


  return constructMetadata({
    page: "InvitationLanding",
    title: `${inviteTitleName} 邀请你加入`,
    description: `${inviteTitleName} 邀请你体验我们的 AI 功能，立即注册享受额外权益。`,
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

  const shareSlug = inviter.invite_code ?? inviteCode;

  const displayName =
    (typeof inviter.full_name === "string" && inviter.full_name.trim().length > 0)
      ? inviter.full_name.trim()
      : inviter.invite_code ?? inviteCode;
  const loginUrl = `${buildLocalePath(locale, "/login")}`;
  const googleNextPath = `${buildLocalePath(locale, "/sign-up")}?invite_code=${encodeURIComponent(
    inviteCode,
  )}`;
  const inviteeRewardCredits = shareRewardConfig.inviteeCredits ?? 0;
  const inviterHeadline =
    typeof displayName === "string" ? displayName.toUpperCase() : displayName;

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#1c1c1a] px-4 py-16 text-white">
      <div className="relative w-full max-w-3xl">
        <InviteCookieSetter ownerId={inviter.id} shareSlug={shareSlug} locale={locale} />
        <div className="relative z-10 mx-auto w-full max-w-lg -mb-8 rounded-3xl bg-[linear-gradient(to_right,_rgb(18,194,233),_rgb(196,113,237),_rgb(246,79,89))] px-8 py-4 text-center text-white shadow-[0_20px_60px_rgba(123,97,255,0.35)]">
          <p className="text-sm font-semibold leading-relaxed">
            {inviterHeadline} has invited you to try BestMaker AI
          </p>
          <p className="text-xs font-medium text-white/85">
            Sign up now and get {inviteeRewardCredits} extra free credits.
          </p>
        </div>

        <div className="relative rounded-[32px] border border-white/10 bg-[#161616] px-8 pb-12 pt-24 shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/10 bg-white/10 shadow-lg">
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
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Sign Up for BestMaker AI
                </h1>
                <p className="text-sm text-white/70 md:text-base">
                  使用好友邀请注册，立即解锁更多 AI 模板、专属积分与最新 Beta 能力。
                </p>
              </div>
            </div>

            <div className="w-full max-w-lg space-y-6 text-left text-white/80">
              <InviteEmailSignup
                inviteCode={inviteCode}
                nextPath={buildLocalePath(locale, "/")}
                googleNextPath={googleNextPath}
                loginUrl={loginUrl}
              />
              <p className="text-center text-[11px] text-white/30">
                注册表示你已阅读并同意我们的{" "}
                <Link
                  className="text-white/50 underline underline-offset-4 hover:text-white"
                  href={buildLocalePath(locale, "/terms-of-service")}
                >
                  使用条款
                </Link>{" "}
                与{" "}
                <Link
                  className="text-white/50 underline underline-offset-4 hover:text-white"
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
