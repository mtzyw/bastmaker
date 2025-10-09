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
    badge: "Hot",
    description: "自动捕捉亲密互动的表情与动作，适合情侣短片与浪漫剧情。",
  },
  {
    slug: "ai-hugging",
    title: "AI拥抱生成器",
    category: "情侣互动",
    badge: "Hot",
    description: "呈现温暖拥抱的动态和灯光，适用于治愈系或情感短视频。",
  },
  {
    slug: "ai-dancing",
    title: "AI摆舞生成器",
    category: "舞动风格",
    badge: "Hot",
    description: "一键编排舞蹈节奏与镜头切换，突出动作张力。",
  },
  {
    slug: "ai-beach-bikini",
    title: "AI比基尼生成器",
    category: "舞动风格",
    badge: "Hot",
    description: "打造夏日沙滩氛围与光效，适合度假风视频。",
  },
  {
    slug: "ai-ghibli",
    title: "AI吉卜力视频生成器",
    category: "情绪氛围",
    description: "将镜头转化为动画质感，营造童话叙事。",
  },
  {
    slug: "ai-bloom",
    title: "AI绽放特效",
    category: "情绪氛围",
    description: "绽放花朵、光束等视觉元素，强化情绪爆发。",
  },
  {
    slug: "ai-happiness",
    title: "快乐慈母感",
    category: "情绪氛围",
    description: "突出温柔笑容与亲子氛围，用于家庭故事场景。",
  },
  {
    slug: "ai-fruit-expand",
    title: "AI膨胀效果",
    category: "情绪氛围",
    description: "夸张放大主体元素，适合趣味短视频。",
  },
  {
    slug: "ai-heart",
    title: "AI比心生成器",
    category: "情侣互动",
    description: "自动生成比心动作和浪漫特效，营造甜蜜氛围。",
  },
  {
    slug: "ai-muscle",
    title: "AI肌肉生成器",
    category: "舞动风格",
    badge: "Hot",
    description: "增强体态与肌肉线条，适合健身或舞蹈题材。",
  },
  {
    slug: "ai-halo",
    title: "上帝拥抱特效",
    category: "情绪氛围",
    description: "为镜头添加柔光与光环，提升神圣感。",
  },
  {
    slug: "ai-planet-mini",
    title: "地球缩小特效",
    category: "情绪氛围",
    description: "缩放地球或背景元素，打造奇幻视角。",
  },
  {
    slug: "ai-siesta",
    title: "AI午睡视频生成器",
    category: "舞动风格",
    description: "模拟慵懒午后光线和动作，营造轻松节奏。",
  },
  {
    slug: "ai-pet-anthropomorphic",
    title: "宠物拟人化AI视频生成器",
    category: "宠物萌拍",
    description: "让宠物动作更拟人，适合萌宠社交内容。",
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
