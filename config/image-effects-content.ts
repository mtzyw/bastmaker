import { Sparkles, Palette, Camera } from "lucide-react";

const BEAUTY_CONTENT = {
  GALLERY_ITEMS: [
    {
      title: "自然肤质提亮",
      description: "一键柔肤及肤色均衡，保留原始细节，呈现自然光泽感。",
    },
    {
      title: "氛围光影调色",
      description: "自动匹配影棚灯光与背景虚化效果，让社交头像更具高级感。",
    },
    {
      title: "微调五官比例",
      description: "智能微调面部结构，避免过度处理，贴近真实美感。",
    },
  ],
  VALUE_CARDS: [
    {
      title: "保留细节",
      description: "针对局部噪点与毛孔进行自适应修复，避免“面具感”。",
      icon: Sparkles,
    },
    {
      title: "风格灵活",
      description: "支持多种人像风格模板，快速切换酷、甜、职场等氛围。",
      icon: Palette,
    },
    {
      title: "批量处理",
      description: "适用于电商模特、博主等场景，每次修改都会保存模板结果。",
      icon: Camera,
    },
  ],
  FAQ_ITEMS: [
    {
      q: "支持哪些图片格式？",
      a: "目前支持 JPG、PNG、WEBP 等常见格式，建议分辨率大于 1024×1024 以获得最佳效果。",
    },
    {
      q: "效果会不会过度磨皮？",
      a: "模板默认启用“自然美颜”参数，可在生成后根据需要再调整细节。",
    },
    {
      q: "可以批量处理吗？",
      a: "可在模板中重复上传不同图片批量处理，未来将开放批量队列功能。",
    },
  ],
};

const CARTOON_CONTENT = {
  ...BEAUTY_CONTENT,
  GALLERY_ITEMS: [
    {
      title: "日系漫画风",
      description: "从真实照片转化为纯净的漫画线条与柔和高光。",
    },
    {
      title: "赛博朋克氛围",
      description: "添加霓虹灯光、粒子与未来都市背景，让照片充满故事感。",
    },
    {
      title: "油画质感",
      description: "模拟传统油画笔触与肌理，适合艺术肖像与海报创作。",
    },
  ],
};

const STUDIO_CONTENT = {
  ...BEAUTY_CONTENT,
  GALLERY_ITEMS: [
    {
      title: "双色影棚光",
      description: "一键生成双色打光效果，突出面部轮廓和立体感。",
    },
    {
      title: "商业级背景替换",
      description: "快速替换纯色、渐变或布景背景，适合电商与证件照优化。",
    },
    {
      title: "胶片颗粒",
      description: "为照片增加胶片颗粒与暖色调，模拟复古棚拍氛围。",
    },
  ],
};

const DEFAULT_CONTENT = BEAUTY_CONTENT;

const CONTENT_MAP: Record<string, any> = {
  "ai-beauty-retouch": BEAUTY_CONTENT,
  "ai-cartoonize": CARTOON_CONTENT,
  "ai-portrait-studio": STUDIO_CONTENT,
};

export function getImageEffectContent(slug: string) {
  return CONTENT_MAP[slug] || DEFAULT_CONTENT;
}
