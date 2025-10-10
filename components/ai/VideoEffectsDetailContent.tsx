import { Button } from "@/components/ui/button";
import type { VideoEffectDefinition } from "@/lib/video-effects/effects";
import { cn } from "@/lib/utils";

const GALLERY_ITEMS = [
  { title: "自然亲吻瞬间", description: "捕捉真实情侣间的亲昵氛围，让每一个细节都充满故事感。", cta: "查看案例" },
  { title: "电影级光影", description: "模拟黄金时刻的柔和光线，赋予画面更具感染力的氛围。", cta: "立即体验" },
  { title: "动漫风格转换", description: "将真实人物转化为动漫角色，营造独特的浪漫视觉。", cta: "了解更多" },
];

const IMMERSIVE_FEATURES = [
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
];

const VALUE_CARDS = [
  {
    title: "友好的用户界面",
    description: "我们的人工智能接吻视频生成器具有用户友好的界面，任何人都可以轻松创建令人惊叹的视频，无需任何技能。",
  },
  {
    title: "高质量的结果",
    description: "我们最先进的人工智能可以将您的照片转化为逼真的、高分辨率的接吻视频，动作自然，无水印。",
  },
  {
    title: "支持多种人工智能模型",
    description: "在 KLING、Hailuo 和 Runway 等多种 AI 模型的支持下，我们的 AI 接吻视频制作工具可以满足不同的创作需求。",
  },
];

const EXTRA_EFFECTS = ["AI 拥抱生成器", "浪漫烟花特效", "宠物拥抱特效", "婚礼誓言特效"];

const FAQ_ITEMS = [
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
];

export function VideoEffectsDetailContent({ effect }: { effect: VideoEffectDefinition }) {
  return (
    <div className="header-bg text-white">
      <div className="container mx-auto px-4 md:px-8 py-16 space-y-16">
        <section className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-semibold">免费 {effect.title} 在线生成器</h2>
          <p className="mx-auto max-w-3xl text-sm md:text-base text-white/70 leading-relaxed">
            使用 {effect.title} 模板，快速打造真实自然的亲密互动镜头。AI 自动处理动作衔接、光效和情绪细节，
            帮助短视频创作者、情感类账号和品牌营销迅速完成高质量作品。
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-white/90">
              立即开始创作
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-2xl md:text-3xl font-semibold text-center">精选案例预览</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {GALLERY_ITEMS.map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/30"
              >
                <div className="relative aspect-video overflow-hidden">
                  <video
                    className="h-full w-full object-cover"
                    src="https://cdn.bestmaker.ai/tasks/10a81006-480e-4ccf-ba60-c9887e2be6f8/0.mp4"
                    playsInline
                    muted
                    loop
                    autoPlay
                  />
                  <div className="pointer-events-none absolute inset-0 border border-white/10" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-14">
          {IMMERSIVE_FEATURES.map((feature, index) => {
            const isReverse = index % 2 !== 0;
            return (
              <div
                key={feature.title}
                className={cn(
                  "grid gap-10 items-center",
                  "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]",
                  isReverse && "lg:[&>*:first-child]:col-start-2 lg:[&>*:last-child]:col-start-1 lg:[&>*]:row-start-1"
                )}
              >
                <div className="space-y-4">
                  <h3 className="text-2xl md:text-3xl font-semibold">{feature.title}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{feature.description}</p>
                  <button
                    type="button"
                    className="relative inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold"
                  >
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-lime-400 via-pink-500 to-purple-500 opacity-80 blur-[2px]" />
                    <span className="absolute inset-[1px] rounded-full bg-black" />
                    <span className="relative text-white">免费试用 AI 接吻视频生成器</span>
                  </button>
                </div>
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                  <video
                    className="aspect-[4/3] md:aspect-video w-full object-cover"
                    src="https://cdn.bestmaker.ai/tasks/10a81006-480e-4ccf-ba60-c9887e2be6f8/0.mp4"
                    playsInline
                    muted
                    loop
                    autoPlay
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/10" />
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-semibold">如何快速使用 {effect.title}</h3>
            <p className="text-sm text-white/60">
              按照以下步骤操作，几分钟即可生成结构完整、情绪真实的短视频内容。
            </p>
            <ol className="space-y-3 text-sm text-white/70">
              <li>
                <span className="font-semibold text-white/90">步骤 1：</span> 上传两人近景素材，或从历史库选择已生成的参考。
              </li>
              <li>
                <span className="font-semibold text-white/90">步骤 2：</span> 在提示词中描述场景、光线与情绪。例如“傍晚草坪，暖色灯光，轻笑对视”。
              </li>
              <li>
                <span className="font-semibold text-white/90">步骤 3：</span> 调整公开可见性、复制保护等选项，点击创建即可生成视频。
              </li>
            </ol>
            <Button className="bg-[#dc2e5a] text-white hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]">
              查看详细教程
            </Button>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-black/30 p-6">
            <div className="aspect-[3/4] rounded-3xl border border-white/10 bg-gradient-to-b from-white/15 to-transparent" />
          </div>
        </section>

        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-center text-2xl md:text-3xl font-semibold">我们的免费 AI 接吻视频生成器的优势</h3>
            <p className="text-sm text-white/60">了解我们的 AI 接吻视频生成器的优势，看看它是如何从其他 AI 工具中脱颖而出的。</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {VALUE_CARDS.map((card) => (
              <div
                key={card.title}
                className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6 text-center"
              >
                <div className="mx-auto h-12 w-12 rounded-full bg-white/10" />
                <h4 className="text-lg font-semibold">{card.title}</h4>
                <p className="text-sm text-white/65 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-center text-2xl md:text-3xl font-semibold">更多免费 AI 视频特效模板</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXTRA_EFFECTS.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center text-sm text-white/70"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-center text-2xl md:text-3xl font-semibold">常见问题</h3>
          <div className="mx-auto max-w-3xl space-y-4">
            {FAQ_ITEMS.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="font-semibold text-white">{q}</p>
                <p className="mt-2 text-sm text-white/65 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
