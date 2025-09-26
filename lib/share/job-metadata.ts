import { getTextToImageModelConfig } from "@/lib/ai/text-to-image-config";
import { getVideoModelConfig } from "@/lib/ai/video-config";

const MODALITY_DISPLAY: Record<string, string> = {
  t2i: "Text to Image",
  i2i: "Image to Image",
  t2v: "Text to Video",
  i2v: "Image to Video",
};

export function shareModalityDisplayName(modality: string | null | undefined) {
  if (!modality) return null;
  return MODALITY_DISPLAY[modality] ?? modality;
}

export function shareModelDisplayName(modality: string | null | undefined, modelSlug: string | null | undefined) {
  if (!modelSlug) return null;
  try {
    if (modality === "t2v" || modality === "i2v") {
      return getVideoModelConfig(modelSlug).displayName;
    }
    return getTextToImageModelConfig(modelSlug).displayName;
  } catch {
    return modelSlug;
  }
}
