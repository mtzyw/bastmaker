import { getVideoCreditsCost } from "@/lib/ai/video-config";

export type VideoLengthValue = "5" | "6" | "8" | "10";
export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "auto";
export type VideoResolutionValue =
  | "360p"
  | "480p"
  | "540p"
  | "580p"
  | "720p"
  | "768p"
  | "1080p";

export type VideoModelIcon = {
  label: string;
  className?: string;
  src?: string;
};

export type VideoModelOption = {
  value: string;
  label: string;
  icon: VideoModelIcon;
  fps?: string;
  credits?: number;
  recommended?: boolean;
  description?: string;
};

export type VideoModelSelectOption = VideoModelOption & {
  tags: string[];
  /** Optional后端标识，便于请求时做模型名称映射 */
  apiValue?: string;
};

export const VIDEO_ASPECT_PRESETS: Record<string, AspectRatio[]> = {
  "Seedance 1.0 Lite": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "Seedance 1.0 Pro": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "Kling v2.1 Master": ["1:1", "16:9", "9:16"],
  "Kling v2.5 Pro": ["1:1", "16:9", "9:16"],
  "wan2.2 Plus": ["auto", "16:9", "9:16", "1:1", "4:3", "3:4"],
  "Kling Std v2.1": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "PixVerse V5": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "PixVerse V5 Transition": ["16:9", "9:16", "1:1", "4:3", "3:4"],
};

export const VIDEO_LENGTH_PRESETS: Record<string, VideoLengthValue[]> = {
  "PixVerse V5": ["5", "8"],
  "PixVerse V5 Transition": ["5", "8"],
  "Seedance 1.0 Lite": ["5", "10"],
  "Seedance 1.0 Pro": ["5", "10"],
  "wan2.2 Plus": ["5", "10"],
  "Kling v2.5 Pro": ["5", "10"],
  "Kling Std v2.1": ["5", "10"],
};

export const VIDEO_RESOLUTION_PRESETS: Record<string, VideoResolutionValue[]> = {
  "Minimax Hailuo 2.0": ["768p", "1080p"],
  "Kling v2.1 Master": ["720p", "1080p"],
  "Kling v2.5 Pro": ["720p", "1080p"],
  "Seedance 1.0 Lite": ["480p", "720p", "1080p"],
  "Seedance 1.0 Pro": ["480p", "720p", "1080p"],
  "wan2.2 Plus": ["480p", "580p", "720p"],
  "PixVerse V5": ["360p", "540p", "720p", "1080p"],
  "PixVerse V5 Transition": ["360p", "540p", "720p", "1080p"],
  "Kling Std v2.1": ["360p", "540p", "720p", "1080p"],
};

export function getAllowedVideoLengths(
  model: string,
  resolution: VideoResolutionValue
): VideoLengthValue[] {
  if (model === "Minimax Hailuo 2.0") {
    if (resolution === "1080p") {
      return ["6"] as VideoLengthValue[];
    }

    if (resolution === "768p") {
      return ["6", "10"] as VideoLengthValue[];
    }

    return ["6"] as VideoLengthValue[];
  }

  if (model === "PixVerse V5" || model === "PixVerse V5 Transition") {
    if (resolution === "1080p") {
      return ["5"] as VideoLengthValue[];
    }
    return ["5", "8"] as VideoLengthValue[];
  }

  if (model === "Kling Std v2.1") {
    return ["5", "10"] as VideoLengthValue[];
  }

  return (VIDEO_LENGTH_PRESETS[model] ?? ["5", "10"]) as VideoLengthValue[];
}

export const DEFAULT_VIDEO_MODEL = "Seedance 1.0 Pro";
export const DEFAULT_VIDEO_RESOLUTION =
  VIDEO_RESOLUTION_PRESETS[DEFAULT_VIDEO_MODEL]?.find((value) => value === "720p") ??
  VIDEO_RESOLUTION_PRESETS[DEFAULT_VIDEO_MODEL]?.[0] ??
  "720p";
export const DEFAULT_VIDEO_LENGTH = getAllowedVideoLengths(
  DEFAULT_VIDEO_MODEL,
  DEFAULT_VIDEO_RESOLUTION
)[0];

const MODEL_ICON_PATHS = {
  hailuo: "/images/modessvg/hailuo.jpg",
  seedance: "/images/modessvg/seedance.jpg",
  google: "/images/modessvg/google.jpg",
  pixverse: "/images/modessvg/pixverse.jpg",
  wan: "/images/modessvg/wan.jpg",
  kling: "/images/modessvg/king.svg",
} as const;

export const VIDEO_MODEL_OPTIONS: VideoModelOption[] = [
  {
    value: "Seedance 1.0 Pro",
    label: "Seedance 1.0 Pro",
    icon: { label: "S", src: MODEL_ICON_PATHS.seedance },
    fps: "24 FPS",
    credits: 10,
    recommended: true,
    description: "高清人像与场景表现",
  },
  {
    value: "Seedance 1.0 Lite",
    label: "Seedance 1.0 Lite",
    icon: { label: "S", src: MODEL_ICON_PATHS.seedance },
    fps: "24 FPS",
    credits: 10,
    description: "轻量人像生成",
  },
  {
    value: "wan2.2 Plus",
    label: "wan2.2 Plus",
    icon: { label: "W", src: MODEL_ICON_PATHS.wan },
    fps: "24 FPS",
    credits: 12,
    description: "高保真场景转换",
  },
  {
    value: "PixVerse V5",
    label: "PixVerse V5",
    icon: { label: "P", src: MODEL_ICON_PATHS.pixverse },
    fps: "24 FPS",
    credits: 25,
    recommended: true,
    description: "高质量动态镜头",
  },

  {
    value: "PixVerse V5 Transition",
    label: "PixVerse V5 Transition",
    icon: { label: "P", src: MODEL_ICON_PATHS.pixverse },
    fps: "24 FPS",
    credits: 25,
    description: "PixVerse 双图转场，上传首尾图生成平滑过渡。",
  },
  {
    value: "Minimax Hailuo 2.0",
    label: "Minimax Hailuo 2.0",
    icon: { label: "M", src: MODEL_ICON_PATHS.hailuo },
    fps: "24 FPS",
    credits: 12,
    description: "火山引擎视频生成模型",
  },
  {
    value: "Kling v2.1 Master",
    label: "Kling v2.1 Master",
    icon: { label: "K", src: MODEL_ICON_PATHS.kling },
    fps: "24 FPS",
    credits: 100,
    description: "高精度场景重建",
  },
  {
    value: "Kling v2.5 Pro",
    label: "Kling v2.5 Pro",
    icon: { label: "K", src: MODEL_ICON_PATHS.kling },
    fps: "24 FPS",
    credits: 100,
    description: "高精度场景重建",
  },
  {
    value: "Kling Std v2.1",
    label: "Kling Std v2.1",
    icon: { label: "K", src: MODEL_ICON_PATHS.kling },
    fps: "24 FPS",
    credits: 60,
  },
];

function formatLengthTag(lengths?: VideoLengthValue[]): string | null {
  if (!lengths || lengths.length === 0) {
    return null;
  }
  const unique = Array.from(new Set(lengths));
  if (unique.length === 1) {
    return `${unique[0]} sec`;
  }
  return `${unique[0]}-${unique[unique.length - 1]} sec`;
}

export const VIDEO_MODEL_SELECT_OPTIONS: VideoModelSelectOption[] = VIDEO_MODEL_OPTIONS.map(
  (option) => {
    const candidateResolutions =
      VIDEO_RESOLUTION_PRESETS[option.value] ?? [DEFAULT_VIDEO_RESOLUTION];
    const candidateLengths =
      VIDEO_LENGTH_PRESETS[option.value] ??
      getAllowedVideoLengths(option.value, candidateResolutions[0]);
    const lengthTag = formatLengthTag(candidateLengths);
    const minCredits = resolveMinimumCredits(option.value, candidateResolutions);
    const tags = [lengthTag].filter(Boolean) as string[];
    return {
      ...option,
      credits: typeof minCredits === "number" ? minCredits : option.credits,
      tags,
    };
  }
);

function resolveMinimumCredits(
  model: string,
  candidateResolutions: VideoResolutionValue[]
): number | null {
  if (!candidateResolutions || candidateResolutions.length === 0) {
    return null;
  }
  let min: number | null = null;
  for (const resolution of candidateResolutions) {
    const allowedLengths = getAllowedVideoLengths(model, resolution);
    for (const length of allowedLengths) {
      const cost = getVideoCreditsCost(model, resolution, length);
      if (min === null || cost < min) {
        min = cost;
      }
    }
  }
  return min;
}

export function getModelOption(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }
  return VIDEO_MODEL_SELECT_OPTIONS.find((item) => item.value === value);
}
