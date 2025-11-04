import Image from "next/image";
import type { ImageEffectTemplate } from "@/lib/image-effects/templates";

const PLACEHOLDER_IMAGE =
  "https://cdn.bestmaker.ai/static/placeholders/image-effect-preview.jpg";

export function ImageEffectsEditorPreview({ effect }: { effect: ImageEffectTemplate }) {
  const previewImage = effect.previewImageUrl ?? PLACEHOLDER_IMAGE;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">效果预览</p>
          <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
            {effect.title}
          </h2>
        </div>
        <div />
      </div>

      <div className="mt-10 flex-1 md:mt-12">
        <div className="mx-auto w-full max-w-2xl">
          <div className="relative w-full overflow-hidden rounded-3xl border border-white/10">
            <div className="relative w-full pb-[100%]">
              <Image
                src={previewImage}
                alt={effect.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
