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
  },
  {
    slug: "ai-hugging",
    title: "AI拥抱生成器",
    category: "情侣互动",
  },
  {
    slug: "ai-beach-bikini",
    title: "AI比基尼生成器",
    category: "舞动风格",
  },
  {
    slug: "ai-shake-video",
    title: "AI抖动视频效果生成器",
    category: "舞动风格",
  },
  {
    slug: "ai-twerk-generator",
    title: "AI电臀舞生成器",
    category: "舞动风格",
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
