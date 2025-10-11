export type VideoEffectDefinition = {
  slug: string;
  title: string;
  category: string;
  badge?: "Hot" | "New";
  description?: string;
};

export const VIDEO_EFFECTS: readonly VideoEffectDefinition[] = [
  {
    slug: "ai-kissing",
    title: "AI接吻视频生成器",
    category: "情侣互动",
    description: "自动捕捉亲密互动的表情与动作，适合情侣短片与浪漫剧情。",
  },
  {
    slug: "ai-hugging",
    title: "AI拥抱生成器",
    category: "情侣互动",
    description: "呈现温暖拥抱的动态和灯光，适用于治愈系或情感短视频。",
  },
  {
    slug: "ai-beach-bikini",
    title: "AI比基尼生成器",
    category: "舞动风格",
    description: "打造夏日沙滩氛围与光效，适合度假风视频。",
  },
  {
    slug: "ai-shake-video",
    title: "AI抖动视频效果生成器",
    category: "舞动风格",
    description: "营造节奏感十足的抖动镜头，让画面更具冲击力与动感。",
  },
  {
    slug: "ai-twerk-generator",
    title: "AI电臀舞生成器",
    category: "舞动风格",
    description: "快速生成电臀舞动作与视角切换，适合舞蹈类短视频创作。",
  },
] as const;

const CATEGORY_ORDER = ["情侣互动", "舞动风格", "情绪氛围", "宠物萌拍"] as const;

export const VIDEO_EFFECT_CATEGORIES: readonly string[] = [
  "全部特效",
  ...CATEGORY_ORDER.filter((category) =>
    VIDEO_EFFECTS.some((effect) => effect.category === category)
  ),
] as const;

export function getVideoEffectBySlug(slug: string) {
  return VIDEO_EFFECTS.find((effect) => effect.slug === slug);
}
