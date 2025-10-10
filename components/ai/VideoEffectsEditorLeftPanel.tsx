"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Link } from "@/i18n/routing";
import type { VideoEffectDefinition } from "@/lib/video-effects/effects";
import { ChevronRight, Coins, Crown, Image as ImageIcon, Info, Upload } from "lucide-react";

type ToggleOption = {
  id: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
  premium?: boolean;
};

const TOGGLE_OPTIONS: readonly ToggleOption[] = [
  {
    id: "public",
    label: "公开可见性",
    description: "允许特效出现在探索页与推荐位。",
    defaultChecked: true,
  },
  {
    id: "protect",
    label: "复制保护",
    description: "防止他人直接克隆我的特效项目。",
    premium: true,
  },
];

export function VideoEffectsEditorLeftPanel({ effect }: { effect: VideoEffectDefinition }) {
  return (
    <div className="w-full h-full text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]" scrollbarClassName="!right-0">
        <div className="flex flex-col gap-6 pt-3 pb-16 pr-2 md:pr-7">
          <div className="space-y-3">
            <Link
              href="/video-effects"
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-white/50 transition hover:text-white"
            >
              返回列表
            </Link>
            <div>
              <p className="text-sm text-white/60">{effect.category}</p>
              <h1 className="mt-1 text-3xl font-semibold text-white md:text-4xl">
                {effect.title}
              </h1>
              {effect.description && (
                <p className="mt-3 text-sm leading-relaxed text-white/70">{effect.description}</p>
              )}
            </div>
          </div>

          <section className="space-y-3">
            <header className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/90">特效模板</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-blue-300 transition hover:text-blue-200"
              >
                更换
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="grid h-16 w-24 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/40">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{effect.title}</p>
                <p className="text-xs text-white/40">内置镜头动作与情绪灯光，可快速输出。</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <header className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/90">输入素材</span>
              <Info className="h-4 w-4 text-white/40" />
            </header>
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 bg-black/40 px-4 py-10 text-sm text-white/60">
              <Upload className="h-6 w-6 text-white/40" />
              <p>点击 / 拖拽 / 粘贴</p>
              <p className="text-xs text-white/40">支持 PNG、JPG、MP4，最大 200MB</p>
              <Button variant="secondary" size="sm" className="bg-white/10 text-white hover:bg-white/20">
                从历史中选择
              </Button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              {TOGGLE_OPTIONS.map((toggle) => (
                <div
                  key={toggle.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-black/30 px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{toggle.label}</p>
                      {toggle.premium && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-200">
                          <Crown className="h-3 w-3" />
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/45">{toggle.description}</p>
                  </div>
                  <Switch defaultChecked={toggle.defaultChecked} aria-label={toggle.label} />
                </div>
              ))}
            </div>
          </section>

        </div>
      </ScrollArea>

      <div className="pt-2 pb-0 shrink-0 border-t border-white/10 -mx-4 md:-mx-6">
        <div className="px-4 md:px-6">
          <div className="mb-3">
            <div className="mb-2 text-sm text-white/80">Output Image Number</div>
            <div className="flex items-center justify-between text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-pink-400" />
                Credits required:
              </div>
              <div>10 Credits</div>
            </div>
          </div>
          <Button className="w-full h-12 text-white transition-colors bg-[#dc2e5a] hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]">
            创建
          </Button>
        </div>
        <div className="mt-6 border-t border-white/10" />
      </div>
    </div>
  );
}
