import type { VideoModelSelectOption } from "@/components/ai/video-models";
import { FREEPIK_MODEL_MAP } from "@/lib/ai/freepik";

const MODEL_ICON_PATHS = {
  flux: "/images/modessvg/flux.jpg",
  google: "/images/modessvg/google.jpg",
  seedream: "/images/modessvg/seedance.jpg",
  nano: "/images/modessvg/google.jpg",
} as const;

export const TEXT_TO_IMAGE_DEFAULT_MODEL = "Nano Banana Free";

export const TEXT_TO_IMAGE_MODEL_OPTIONS: VideoModelSelectOption[] = [
  {
    value: "Nano Banana Free",
    label: "Nano Banana Free",
    icon: { label: "N", src: MODEL_ICON_PATHS.nano },
    recommended: true,
    credits: 5,
    description: "免费入门模型，适合快速尝试。",
    tags: ["免费", "极速"],
    apiValue: FREEPIK_MODEL_MAP["Nano Banana Free"],
  },
  {
    value: "Flux Dev",
    label: "Flux Dev",
    icon: { label: "F", src: MODEL_ICON_PATHS.flux },
    description: "Flux 开发版，细节表现均衡。",
    credits: 5,
    tags: ["高清", "自然光"],
    apiValue: FREEPIK_MODEL_MAP["Flux Dev"],
  },
  {
    value: "Flux Pro 1.1",
    label: "Flux Pro 1.1",
    icon: { label: "F", src: MODEL_ICON_PATHS.flux },
    description: "Flux 专业版 1.1，提供更高写实度和稳定性。",
    credits: 5,
    tags: ["写实", "精细"],
    apiValue: FREEPIK_MODEL_MAP["Flux Pro 1.1"],
  },
  {
    value: "Hyperflux",
    label: "Hyperflux",
    icon: { label: "H", src: MODEL_ICON_PATHS.flux },
    description: "Flux 高性能版本，追求更强表现。",
    credits: 5,
    tags: ["写实", "动态"],
    apiValue: FREEPIK_MODEL_MAP["Hyperflux"],
  },
  {
    value: "Google Imagen4",
    label: "Google Imagen4",
    icon: { label: "G", src: MODEL_ICON_PATHS.google },
    description: "Google Imagen 4，色彩细腻。",
    credits: 5,
    tags: ["高保真", "多风格"],
    apiValue: FREEPIK_MODEL_MAP["Google Imagen4"],
  },
  {
    value: "Seedream 4",
    label: "Seedream 4",
    icon: { label: "S", src: MODEL_ICON_PATHS.seedream },
    description: "Seedream 4，场景氛围表现出色。",
    credits: 5,
    tags: ["氛围", "写意"],
    apiValue: FREEPIK_MODEL_MAP["Seedream 4"],
  },
  {
    value: "Seedream 4 Edit",
    label: "Seedream 4 Edit",
    icon: { label: "S", src: MODEL_ICON_PATHS.seedream },
    description: "Seedream 4 编辑模式，适合局部调整。",
    credits: 5,
    tags: ["编辑", "精修"],
    apiValue: FREEPIK_MODEL_MAP["Seedream 4 Edit"],
  },
];

export function getTextToImageApiModel(model: string): string {
  return (
    TEXT_TO_IMAGE_MODEL_OPTIONS.find((option) => option.value === model)?.apiValue ?? model
  );
}
