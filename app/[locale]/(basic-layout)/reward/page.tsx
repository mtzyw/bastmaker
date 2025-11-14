import { Metadata } from "next";
import Link from "next/link";

import InviteRewardPanel from "@/components/reward/InviteRewardPanel";
import { shareRewardConfig, SHARE_REWARD_OWNER_LOG_TYPE } from "@/config/share";
import { DEFAULT_LOCALE, Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;

  return constructMetadata({
    page: "InviteReward",
    title: "邀请好友赚积分 · BestMaker",
    description: "复制你的专属邀请链接，邀请好友注册即可领取额外积分奖励。",
    locale: locale as Locale,
    path: "/reward",
  });
}

function buildLocalePath(locale: string, path: string) {
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  return `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}

function getSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return configured || "http://localhost:3000";
}

export default async function RewardPage({
  params,
}: {
  params: Params;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-[#1c1c1a10] px-4 py-16 text-white">
        <section className="mx-auto flex max-w-4xl flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-[#12121a] to-[#050505] px-8 py-16 text-center shadow-[0_40px_120px_rgba(9,9,11,0.6)]">
          <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-white/40">
            <span>BestMaker</span>
            <div className="h-px w-8 bg-white/20" />
            <span>Rewards</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            登录以生成你的邀请奖励页面
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/70 md:text-base">
            复制专属链接、分享给好友，即可领取额外积分奖励并解锁更多 AI 模型能力。
          </p>
          <Button asChild size="lg" className="mt-10 h-12 rounded-2xl px-10 text-base font-semibold">
            <Link href={buildLocalePath(locale, "/sign-in")}>立即登录</Link>
          </Button>
        </section>
      </main>
    );
  }

  const [{ data: profile }, { data: creditLogs }] = await Promise.all([
    supabase.from("users").select("full_name, invite_code").eq("id", user.id).maybeSingle(),
    supabase
      .from("credit_logs")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", SHARE_REWARD_OWNER_LOG_TYPE),
  ]);

  const inviteCode = profile?.invite_code ?? null;
  const siteOrigin = getSiteOrigin();
  const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const inviteLink =
    inviteCode != null
      ? `${siteOrigin}${localePrefix}/invitation-landing?invite_code=${encodeURIComponent(
          inviteCode,
        )}&utm_source=invite&utm_medium=reward_page`
      : null;

  const inviteRewardCredits =
    creditLogs?.reduce((sum, log) => sum + (log.amount ?? 0), 0) ?? 0;
  const previewMessage = `大家好！我刚刚在 BestMaker AI 体验了超多好玩的 AI 生成功能。使用我的邀请链接注册即可获得额外积分：${
    inviteLink ?? ""
  }`;

  return (
    <main className="min-h-screen bg-[#1c1c1a10] px-4 py-16 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <InviteRewardPanel
          inviteLink={inviteLink}
          inviteCode={inviteCode}
          inviteRewardCredits={inviteRewardCredits}
          previewMessage={previewMessage}
          ownerReward={shareRewardConfig.ownerCredits}
          inviteeReward={shareRewardConfig.inviteeCredits}
        />
      </div>
    </main>
  );
}
