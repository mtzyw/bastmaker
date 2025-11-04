export type ImageEffectDefinition = {
  slug: string;
  title: string;
  category: string;
  badge?: "Hot" | "New";
  description?: string;
};

export const IMAGE_EFFECTS: readonly ImageEffectDefinition[] = [
  {
    slug: "ai-beauty-retouch",
    title: "AI美颜特效",
    category: "人物美化",
    description: "一键柔肤、美白、提亮肤色，打造自然高级的精修效果。",
  },
  {
    slug: "ai-cartoonize",
    title: "AI卡通特效",
    category: "艺术风格",
    description: "将真人照片转化为动漫插画，保留表情细节与光影氛围。",
  },
  {
    slug: "ai-portrait-studio",
    title: "AI棚拍光影",
    category: "场景氛围",
    description: "模拟影棚灯光与背景，快速生成商业质感的人像作品。",
  },
] as const;

const CATEGORY_ORDER = ["人物美化", "艺术风格", "场景氛围"] as const;

export const IMAGE_EFFECT_CATEGORIES: readonly string[] = [
  "全部特效",
  ...CATEGORY_ORDER.filter((category) =>
    IMAGE_EFFECTS.some((effect) => effect.category === category)
  ),
] as const;

export function getImageEffectBySlug(slug: string) {
  return IMAGE_EFFECTS.find((effect) => effect.slug === slug);
}
