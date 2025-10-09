import { Badge } from "@/components/ui/badge";
import type { VideoEffectDefinition } from "@/lib/video-effects/effects";

export function VideoEffectsEditorPreview({ effect }: { effect: VideoEffectDefinition }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">实时预览</p>
          <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">{effect.title}</h2>
          <p className="mt-2 text-sm text-white/60">
            根据上传素材和输出设置，预览合成结果并调整细节。
          </p>
        </div>
        {effect.badge && (
          <Badge className="rounded-full bg-red-500 px-3 py-1 text-xs uppercase tracking-widest text-white">
            {effect.badge}
          </Badge>
        )}
      </div>

      <div className="mt-10 flex flex-1 min-h-0 flex-col">
        <div className="relative mx-auto w-full max-w-3xl flex-1">
          <div className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-br from-white/10 via-transparent to-white/5 blur-2xl" />
          <div className="flex h-full min-h-[380px] flex-col rounded-[32px] border border-white/10 bg-black/30 p-6">
            <div className="flex-1">
              <div className="relative mx-auto h-full max-w-2xl rounded-[28px] border border-white/10 bg-black/40 p-4">
                <div className="aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-black">
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-white/40">
                    <span>预览区域</span>
                    <span className="text-[10px] tracking-[0.4em] text-white/30">等待素材上传</span>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-white/5" />
              </div>
            </div>
            <div className="mt-6 flex flex-col items-center gap-4 text-xs text-white/60 md:flex-row md:justify-between">
              <span>滑动探索 ⌄</span>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white/10 px-4 py-2 text-[11px] uppercase tracking-widest text-white/60">
                  模板演示
                </span>
                <span className="text-[11px] text-white/40">支持 16:9 / 9:16 输出</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
