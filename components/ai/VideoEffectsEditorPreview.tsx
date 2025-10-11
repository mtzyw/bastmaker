import type { VideoEffectDefinition } from "@/lib/video-effects/effects";

export function VideoEffectsEditorPreview({ effect }: { effect: VideoEffectDefinition }) {
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
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src="https://cdn.bestmaker.ai/tasks/10a81006-480e-4ccf-ba60-c9887e2be6f8/0.mp4"
                playsInline
                muted
                loop
                autoPlay
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
