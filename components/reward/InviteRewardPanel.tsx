"use client";

import type { LucideIcon } from "lucide-react";
import {
  Copy,
  Facebook,
  Gift,
  Linkedin,
  MessageCircle,
  Send,
  Sparkles,
  Twitter,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type InviteRewardPanelProps = {
  inviteLink: string | null;
  inviteCode: string | null;
  previewMessage: string;
  inviteRewardCredits: number;
  ownerReward: number;
  inviteeReward: number;
};

type ShareButton = {
  id: string;
  label: string;
  icon: LucideIcon;
  buildUrl?: (link: string, message: string) => string;
};

const emojiRow = ["🧑🏻‍🎨", "🧑🏽‍🚀", "🧑🏻‍💻", "🧑🏼‍🔬", "🧑🏾‍🎤", "🎁", "🧑🏽‍🎨", "🧑🏻‍🚀", "🧑🏾‍💻", "🧑🏼‍🎤"];

const shareButtons: ShareButton[] = [
  { id: "default", label: "默认", icon: Sparkles },
  {
    id: "facebook",
    label: "Facebook",
    icon: Facebook,
    buildUrl: (link, message) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(
        message,
      )}`,
  },
  {
    id: "twitter",
    label: "X",
    icon: Twitter,
    buildUrl: (link, message) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    buildUrl: (link, message) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${message} ${link}`)}`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    buildUrl: (link, message) =>
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(link)}&summary=${encodeURIComponent(
        message,
      )}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: Send,
    buildUrl: (link, message) =>
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`,
  },
];

const numberFormatter = new Intl.NumberFormat("zh-CN");

export default function InviteRewardPanel({
  inviteLink,
  inviteCode,
  previewMessage,
  inviteRewardCredits,
  ownerReward,
  inviteeReward,
}: InviteRewardPanelProps) {
  const [activeShare, setActiveShare] = useState<string>("default");
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const inviteStats = useMemo(
    () => ({
      label: "邀请积分",
      value: inviteRewardCredits,
      action: "邀请好友",
    }),
    [inviteRewardCredits],
  );

  const handleCopyLink = async () => {
    if (!inviteLink) {
      toast.error("暂无可复制的邀请链接");
      return;
    }
    try {
      setIsCopyingLink(true);
      await navigator.clipboard.writeText(inviteLink);
      toast.success("邀请链接已复制");
    } catch (error) {
      console.error("[invite-reward] copy link failed", error);
      toast.error("复制失败，请稍后再试");
    } finally {
      setIsCopyingLink(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!inviteLink) {
      toast.error("请先生成邀请链接");
      return;
    }
    try {
      await navigator.clipboard.writeText(previewMessage);
      toast.success("邀请文案已复制");
    } catch (error) {
      console.error("[invite-reward] copy message failed", error);
      toast.error("复制失败，请稍后再试");
    }
  };

  const handleShare = async (button: ShareButton) => {
    if (!inviteLink) {
      toast.error("暂无邀请链接可分享");
      return;
    }
    setActiveShare(button.id);

    if (!button.buildUrl) {
      await handleCopyMessage();
      return;
    }

    const url = button.buildUrl(inviteLink, previewMessage);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const inviteHint =
    inviteCode == null
      ? "你还没有设置邀请代码，请在个人资料页配置后再来试试。"
      : "复制链接分享给好友，当他们注册后双方都能领取积分奖励。";

  return (
    <section className="space-y-10">
      <div
        className="rounded-[32px] px-8 py-10 shadow-[0_45px_160px_rgba(6,6,10,0.65)]"
        style={{
          background: "linear-gradient(to right, rgb(33, 150, 243), rgb(244, 67, 54))",
        }}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3 text-2xl">
            {emojiRow.map((emoji, index) => (
              <span key={index} aria-hidden>
                {emoji}
              </span>
            ))}
          </div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-r from-[#ff4de1] via-[#ff8f56] to-[#ffe44d] text-3xl shadow-lg shadow-[#ff7bfe]/40">
            <Gift className="h-9 w-9 text-[#1b1425]" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/50">REWARD CENTER</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white md:text-4xl">
              赚取免费积分并解锁高级功能！
            </h1>
            <p className="mt-3 text-sm text-white/70 md:text-base">
              分享你的邀请链接，好友注册即可获得额外积分；你也能立即领取{" "}
              <span className="font-semibold text-white">{ownerReward}</span> 积分，好友可获得{" "}
              <span className="font-semibold text-white">{inviteeReward}</span> 积分。
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-6 rounded-[28px] bg-white/[0.04] p-6 shadow-[0_25px_80px_rgba(5,5,7,0.45)] backdrop-blur">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">获取您的推荐链接</h2>
              <p className="mt-1 text-sm text-white/70">{inviteHint}</p>
            </div>
          </header>

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-wide text-white/50">邀请链接</label>
              <Input
                readOnly
                value={inviteLink ?? "尚未生成邀请链接"}
                className="mt-2 h-12 rounded-2xl border-transparent bg-black/25 text-sm text-white placeholder:text-white/40 focus-visible:ring-white/30"
              />
            </div>
            <Button
              className="h-12 rounded-2xl bg-white/95 px-6 text-sm font-semibold text-black transition hover:bg-white"
              disabled={!inviteLink || isCopyingLink}
              onClick={handleCopyLink}
            >
              邀请 & 立即赚取
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            {shareButtons.map((button) => (
              <button
                key={button.id}
                aria-label={button.label}
                disabled={!inviteLink}
                onClick={() => handleShare(button)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/70 ring-1 ring-white/10 transition disabled:cursor-not-allowed disabled:opacity-40",
                  activeShare === button.id ? "bg-white/15 text-white" : "hover:bg-white/10 hover:text-white",
                )}
              >
                <button.icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <div className="rounded-[24px] bg-black/30 p-4 shadow-inner shadow-black/40">
            <div className="mb-3 flex items-center justify-between text-sm text-white/70">
              <div className="flex items-center gap-2">
                <span>预览</span>
                <span className="text-white/40">你可以直接复制以下完整文案</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-white"
                onClick={handleCopyMessage}
                disabled={!inviteLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              readOnly
              value={previewMessage}
              className="min-h-[120px] resize-none rounded-xl border-white/10 bg-transparent text-sm text-white placeholder:text-white/40"
            />
          </div>
        </div>
      </div>

        <div className="space-y-4 text-center flex flex-col items-center">
          <h3 className="text-lg font-semibold text-white">奖励</h3>
          <div className="w-full max-w-sm">
            <div className="rounded-[28px] bg-white/[0.05] p-6 text-center shadow-[0_18px_60px_rgba(5,5,8,0.55)]">
              <p className="text-sm text-white/60">{inviteStats.label}</p>
              <p className="mt-2 text-4xl font-semibold text-white">
                {numberFormatter.format(inviteStats.value)}
              </p>
              <div className="mt-4 text-xs uppercase tracking-[0.3em] text-white/40">
                {inviteStats.action}
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}
