export type VideoLengthValue = "5" | "6" | "8" | "10";
export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
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
  className: string;
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
};

export const VIDEO_ASPECT_PRESETS: Record<string, AspectRatio[]> = {
  "Seedance 1.0 Lite": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "Seedance 1.0 Pro": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "Kling v2.1 Master": ["1:1", "16:9", "9:16"],
  "wan2.2 Plus": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "Kling Std v2.1": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "Kling v2": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "Kling Pro 1.6": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "Kling Std 1.6": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "Kling Elements Pro 1.6": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "Kling Elements Std 1.6": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "PixVerse V5": ["16:9", "9:16", "1:1", "4:3", "3:4"],
};

export const VIDEO_LENGTH_PRESETS: Record<string, VideoLengthValue[]> = {
  "PixVerse V5": ["5", "8"],
  "Seedance 1.0 Lite": ["5", "10"],
  "Seedance 1.0 Pro": ["5", "10"],
  "wan2.2 Plus": ["5", "10"],
  "Kling Std v2.1": ["5", "8"],
  "Kling v2": ["5", "8"],
  "Kling Pro 1.6": ["5", "8"],
  "Kling Std 1.6": ["5", "8"],
  "Kling Elements Pro 1.6": ["5", "8"],
  "Kling Elements Std 1.6": ["5", "8"],
};

export const VIDEO_RESOLUTION_PRESETS: Record<string, VideoResolutionValue[]> = {
  "Minimax Hailuo 2.0": ["768p", "1080p"],
  "Kling v2.1 Master": ["720p", "1080p"],
  "Seedance 1.0 Lite": ["480p", "720p", "1080p"],
  "Seedance 1.0 Pro": ["480p", "720p", "1080p"],
  "wan2.2 Plus": ["480p", "580p", "720p"],
  "PixVerse V5": ["360p", "540p", "720p", "1080p"],
  "Kling Std v2.1": ["360p", "540p", "720p", "1080p"],
  "Kling v2": ["360p", "540p", "720p", "1080p"],
  "Kling Pro 1.6": ["360p", "540p", "720p", "1080p"],
  "Kling Std 1.6": ["360p", "540p", "720p", "1080p"],
  "Kling Elements Pro 1.6": ["360p", "540p", "720p", "1080p"],
  "Kling Elements Std 1.6": ["360p", "540p", "720p", "1080p"],
};

export function getAllowedVideoLengths(
  model: string,
  resolution: VideoResolutionValue
): VideoLengthValue[] {
  if (model === "Minimax Hailuo 2.0") {
    if (resolution === "1080p") {
      return ["6"];
    }

    if (resolution === "768p") {
      return ["6", "10"];
    }

    return ["6"];
  }

  return VIDEO_LENGTH_PRESETS[model] ?? ["5", "10"];
}

export const DEFAULT_VIDEO_MODEL = "Minimax Hailuo 2.0";
export const DEFAULT_VIDEO_RESOLUTION =
  VIDEO_RESOLUTION_PRESETS[DEFAULT_VIDEO_MODEL]?.[0] ?? "720p";
export const DEFAULT_VIDEO_LENGTH = getAllowedVideoLengths(
  DEFAULT_VIDEO_MODEL,
  DEFAULT_VIDEO_RESOLUTION
)[0];

const klingIcon = "bg-cyan-500/80 text-white";
const seedanceIcon = "bg-sky-500/80 text-white";
const minimaxIcon = "bg-indigo-500/80 text-white";
const pixverseIcon = "bg-fuchsia-500/80 text-white";
const wanIcon = "bg-amber-500/80 text-white";

export const VIDEO_MODEL_OPTIONS: VideoModelOption[] = [
  {
    value: "Minimax Hailuo 2.0",
    label: "Minimax Hailuo 2.0",
    icon: { label: "M", className: minimaxIcon },
    fps: "24 FPS",
    credits: 12,
    description: "火山引擎视频生成模型",
  },
  {
    value: "Seedance 1.0 Pro",
    label: "Seedance 1.0 Pro",
    icon: { label: "S", className: seedanceIcon },
    fps: "24 FPS",
    credits: 10,
    recommended: true,
    description: "高清人像与场景表现",
  },
  {
    value: "Veo3 Fast Pro",
    label: "Veo3 Fast Pro",
    icon: { label: "V", className: "bg-blue-500/80 text-white" },
    fps: "24 FPS",
    credits: 100,
    description: "Google Veo 快速版",
  },
  {
    value: "Seedance 1.0 Lite",
    label: "Seedance 1.0 Lite",
    icon: { label: "S", className: seedanceIcon },
    fps: "24 FPS",
    credits: 10,
    description: "轻量人像生成",
  },
  {
    value: "PixVerse V5",
    label: "PixVerse V5",
    icon: { label: "P", className: pixverseIcon },
    fps: "24 FPS",
    credits: 25,
    recommended: true,
    description: "高质量动态镜头",
  },
  {
    value: "Kling v2.1 Master",
    label: "Kling v2.1 Master",
    icon: { label: "K", className: klingIcon },
    fps: "24 FPS",
    credits: 100,
    description: "高精度场景重建",
  },
  {
    value: "Kling Std v2.1",
    label: "Kling Std v2.1",
    icon: { label: "K", className: klingIcon },
    fps: "24 FPS",
    credits: 60,
  },
  {
    value: "Kling v2",
    label: "Kling v2",
    icon: { label: "K", className: klingIcon },
    fps: "24 FPS",
    credits: 45,
  },
  {
    value: "Kling Pro 1.6",
    label: "Kling Pro 1.6",
    icon: { label: "K", className: klingIcon },
    fps: "24 FPS",
    credits: 35,
  },
  {
    value: "Kling Std 1.6",
    label: "Kling Std 1.6",
    icon: { label: "K", className: klingIcon },
    fps: "24 FPS",
    credits: 25,
  },
  {
    value: "Kling Elements Pro 1.6",
    label: "Kling Elements Pro 1.6",
    icon: { label: "K", className: klingIcon },
    fps: "24 FPS",
    credits: 30,
  },
  {
    value: "Kling Elements Std 1.6",
    label: "Kling Elements Std 1.6",
    icon: { label: "K", className: klingIcon },
    fps: "24 FPS",
    credits: 18,
  },
  {
    value: "wan2.2 Plus",
    label: "wan2.2 Plus",
    icon: { label: "W", className: wanIcon },
    fps: "24 FPS",
    credits: 12,
    description: "高保真场景转换",
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

function formatResolutionTag(resolutions?: VideoResolutionValue[]): string | null {
  if (!resolutions || resolutions.length === 0) {
    return null;
  }
  const values = [...resolutions];
  if (values.length === 1) {
    return values[0];
  }
  return `${values[0]}-${values[values.length - 1]}`;
}

export const VIDEO_MODEL_SELECT_OPTIONS: VideoModelSelectOption[] = VIDEO_MODEL_OPTIONS.map(
  (option) => {
    const candidateResolutions =
      VIDEO_RESOLUTION_PRESETS[option.value] ?? [DEFAULT_VIDEO_RESOLUTION];
    const candidateLengths =
      VIDEO_LENGTH_PRESETS[option.value] ??
      getAllowedVideoLengths(option.value, candidateResolutions[0]);
    const lengthTag = formatLengthTag(candidateLengths);
    const resolutionTag = formatResolutionTag(
      VIDEO_RESOLUTION_PRESETS[option.value]
    );
    const tags = [lengthTag, resolutionTag, option.fps].filter(Boolean) as string[];
    return {
      ...option,
      tags,
    };
  }
);

export function getModelOption(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }
  return VIDEO_MODEL_SELECT_OPTIONS.find((item) => item.value === value);
}
