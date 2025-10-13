import type { VideoEffectTemplate } from "@/lib/video-effects/templates";

export function VideoEffectsEditorPreview({ effect }: { effect: VideoEffectTemplate }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">预览视频</p>
          <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">{effect.title}</h2>
        </div>
        <div />
      </div>

      <div className="mt-10 md:mt-12 flex-1 min-h-0">
        <div className="mx-auto w-full max-w-3xl">
          <div className="relative w-full overflow-hidden rounded-3xl border border-white/10">
            <div className="relative w-full pb-[56.25%]">
              {effect.previewVideoUrl ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src={effect.previewVideoUrl}
                  playsInline
                  muted
                  loop
                  autoPlay
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white/60">
                  暂无预览视频
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
