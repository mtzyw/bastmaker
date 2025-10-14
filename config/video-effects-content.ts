
import { Smile, Award, Layers } from "lucide-react";

const AI_KISSING_CONTENT = {
  GALLERY_ITEMS: [
    { title: "自然亲吻瞬间", description: "捕捉真实情侣间的亲昵氛围，让每一个细节都充满故事感。"},
    { title: "电影级光影", description: "模拟黄金时刻的柔和光线，赋予画面更具感染力的氛围。"},
    { title: "动漫风格转换", description: "将真实人物转化为动漫角色，营造独特的浪漫视觉。"},
  ],
  IMMERSIVE_FEATURES: [
    {
      title: "逼真的人工智能接吻和法式接吻视频",
      description: "体验我们逼真的 AI 接吻和法式接吻视频生成能力。借助先进的算法，生成的动画动作流畅、表情富有情感，宛若真实发生。",
    },
    {
      title: "无限的接吻方式",
      description: "Pollo AI 提供多样的接吻模板，包括温柔之吻、法式接吻以及趣味场景，自由组合细节，打造理想中的浪漫故事。",
    },
    {
      title: "多种配对选项",
      description: "支持情侣、朋友或虚拟角色等多种组合，AI 接吻视频生成器都能满足，轻松完成个性化创作。",
    },
    {
      title: "适合各种应用",
      description: "广泛适用于营销活动、社交媒体或个人纪念内容，为观众带来既真诚又吸引人的表达方式。",
    },
  ],
  VALUE_CARDS: [
    {
      title: "友好的用户界面",
      description: "我们的人工智能接吻视频生成器具有用户友好的界面，任何人都可以轻松创建令人惊叹的视频，无需任何技能。",
      icon: Smile,
    },
    {
      title: "高质量的结果",
      description: "我们最先进的人工智能可以将您的照片转化为逼真的、高分辨率的接吻视频，动作自然，无水印。",
      icon: Award,
    },
    {
      title: "支持多种人工智能模型",
      description: "在 KLING、Hailuo 和 Runway 等多种 AI 模型的支持下，我们的 AI 接吻视频制作工具可以满足不同的创作需求。",
      icon: Layers,
    },
  ],
  FAQ_ITEMS: [
    {
      q: "什么是 AI 接吻视频生成器？",
      a: "人工智能接吻视频生成器是一种工具，您只需上传两张照片，就能制作出浪漫的接吻动画。我们的尖端人工智能技术可以制作出流畅逼真的接吻动作，非常适合在社交媒体上分享或作为个人纪念品保存。",
    },
    {
      q: "如何使用 AI 亲吻视频生成器？",
      a: "使用 AI 亲吻视频生成器很简单！只需上传两张照片，每张照片包含一个人。AI 将自动识别面部特征，只需点击几下就能生成美丽的亲吻视频。准备好后下载并分享高清视频。",
    },
    {
      q: "使用 AI 亲吻视频生成器需要视频编辑技能吗？",
      a: "不需要，您无需任何视频编辑经验！AI 亲吻视频生成器设计得易于使用。只需上传您的照片，选择一个模板，让 AI 完成其余工作，非常适合初学者和没有视频编辑技能的人。",
    },
    {
      q: "我可以在任何场合使用 AI 亲吻视频生成器吗？",
      a: "是的！AI 亲吻视频生成器适合任何场合，无论是浪漫时刻、纪念日、求婚还是仅仅为了好玩。您可以创建个性化的亲吻视频与亲人分享或作为特殊回忆保存。",
    },
    {
      q: "我应该上传什么类型的照片？",
      a: "为了获得最佳效果，请上传两张清晰的照片，每张照片包含一个面部可见的人。确保照片光线良好且分辨率高，AI 能轻松检测面部特征时可生成更流畅的动画。",
    },
    {
      q: "AI 亲吻视频生成器是免费使用的吗？",
      a: "是的，您可以在 MindVideo 上免费使用 AI 亲吻视频生成器！上传照片即可生成亲吻视频，无需任何费用。一些高级功能可能需要升级计划，但基础功能对所有人都是免费的。",
    },
  ],
};

const DEFAULT_CONTENT = {
  GALLERY_ITEMS: AI_KISSING_CONTENT.GALLERY_ITEMS,
  IMMERSIVE_FEATURES: AI_KISSING_CONTENT.IMMERSIVE_FEATURES,
  VALUE_CARDS: AI_KISSING_CONTENT.VALUE_CARDS,
  FAQ_ITEMS: AI_KISSING_CONTENT.FAQ_ITEMS,
};

const CONTENT_MAP: Record<string, any> = {
  "ai-kissing": AI_KISSING_CONTENT,
};

export function getVideoEffectContent(slug: string) {
  return CONTENT_MAP[slug] || DEFAULT_CONTENT;
}
