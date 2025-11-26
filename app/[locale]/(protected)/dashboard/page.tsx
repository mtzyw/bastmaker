import Link from "next/link";
import { ArrowRight, Sparkles, Activity, ShieldCheck, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const highlightCards = [
  {
    title: "AI 模板中心",
    description: "探索最新的图像、音效、视频模型，随时切换想要的风格。",
    href: "/image-to-image",
    icon: Sparkles,
  },
  {
    title: "最近任务与进度",
    description: "查看生成历史、任务状态与积分消耗详情，追踪全部迭代。",
    href: "/dashboard/overview",
    icon: Activity,
  },
  {
    title: "安全与资源",
    description: "管理账号安全、订阅与团队资源分配，确保顺畅运行。",
    href: "/dashboard/settings",
    icon: ShieldCheck,
  },
];

const quickLinks = [
  { label: "邀请好友领取积分", href: "/invitation-landing?invite_code=bestmaker", icon: Gift },
  { label: "上传参考素材", href: "/uploads" },
  { label: "切换其他模型", href: "/image-to-image" },
  { label: "查看积分记录", href: "/dashboard/overview" },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 md:px-6 lg:px-8">
        <section className="rounded-[32px] border border-border bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 px-8 py-10 text-foreground shadow-[0_25px_80px_rgba(15,23,42,0.25)] dark:from-primary/20 dark:via-accent/20 dark:to-secondary/20">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4 text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                BESTMAKER 控制台
              </p>
              <h1 className="text-3xl font-semibold md:text-4xl">
                欢迎回来，继续你的创作旅程
              </h1>
              <p className="max-w-2xl text-muted-foreground">
                这里是你的 AI 控制面板：随时启动最新的模型，管理积分、任务与团队资源。邀请好友或订阅计划，还能获得额外的欢迎礼。
              </p>
            </div>
            <div className="rounded-3xl border border-border/50 bg-card/80 px-6 py-4 text-left shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                当前积分
              </p>
              <p className="text-4xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">登录后可查看使用情况和剩余积分</p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {highlightCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative flex h-full flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:bg-muted"
            >
              <div className="space-y-3">
                <card.icon className="h-6 w-6 text-amber-500 dark:text-amber-300" />
                <h3 className="text-xl font-semibold">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
              <div className="mt-6 inline-flex items-center text-sm font-semibold text-amber-500 dark:text-amber-300">
                查看详情
                <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                  快速操作
                </p>
                <h2 className="text-2xl font-semibold">常用入口</h2>
              </div>
              <Sparkles className="h-5 w-5 text-amber-500 dark:text-amber-300" />
            </div>
            <div className="grid gap-3">
              {quickLinks.map((link) => (
                <Button
                  key={link.label}
                  variant="outline"
                  className="w-full justify-between rounded-2xl"
                  asChild
                >
                  <Link href={link.href}>
                    <span>{link.label}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                  活动优惠
                </p>
                <h2 className="text-2xl font-semibold">邀请计划与积分奖励</h2>
              </div>
              <Gift className="h-5 w-5 text-amber-500 dark:text-amber-300" />
            </div>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>邀请好友注册成功，你与好友都可获得额外积分。好友越多，奖励越多。</p>
              <p>订阅年度计划可解锁更高额度、优先体验 Beta 能力，并享受专属客服。</p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1 rounded-2xl">
                复制邀请链接
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                asChild
              >
                <Link href="/pricing">查看订阅方案</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
