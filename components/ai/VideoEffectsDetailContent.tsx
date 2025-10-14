import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VIDEO_EFFECTS, type VideoEffectDefinition } from "@/lib/video-effects/effects";
import { cn } from "@/lib/utils";
import { getVideoEffectContent } from "@/config/video-effects-content";
import { VideoEffectTemplate } from "@/lib/video-effects/templates";

const PLACEHOLDER_VIDEO_URL = "https://cdn.bestmaker.ai/tasks/10a81006-480e-4ccf-ba60-c9887e2be6f8/0.mp4";

function getSuggestedEffects(
  currentSlug: string,
  allEffects: VideoEffectTemplate[]
): VideoEffectTemplate[] {
  const candidates = allEffects.filter((item) => item.slug !== currentSlug);

  if (candidates.length <= 3) {
    return candidates.slice(0, 3);
  }

  const shuffled = [...candidates];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 3);
}

export function VideoEffectsDetailContent({ 
  effect, 
  allEffects 
}: { 
  effect: VideoEffectTemplate;
  allEffects: VideoEffectTemplate[];
}) {
  const suggestedEffects = getSuggestedEffects(effect.slug, allEffects);
  const content = getVideoEffectContent(effect.slug);
  const pageContent = effect.metadata?.pageContent;

  const detailVideoUrls = pageContent?.detailVideoUrls?.length === 7 
    ? pageContent.detailVideoUrls 
    : Array(7).fill(PLACEHOLDER_VIDEO_URL);

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
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-white/90">
              <a href="#">立即开始创作</a>
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-2xl md:text-3xl font-semibold text-center">精选案例预览</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {content.GALLERY_ITEMS.map((item: any, index: number) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/30"
              >
                <div className="relative aspect-video overflow-hidden">
                  <video
                    className="h-full w-full object-cover"
                    src={detailVideoUrls[index]}
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
          {content.IMMERSIVE_FEATURES.map((feature: any, index: number) => {
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
                  <a
                    href="#"
                    className="relative inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold"
                  >
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-lime-400 via-pink-500 to-purple-500 opacity-80 blur-[2px]" />
                    <span className="absolute inset-[1px] rounded-full bg-black" />
                    <span className="relative text-white">免费试用 AI 接吻视频生成器</span>
                  </a>
                </div>
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                  <video
                    className="aspect-[4/3] md:aspect-video w-full object-cover"
                    src={detailVideoUrls[index + 3]}
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
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-center text-2xl md:text-3xl font-semibold">我们的免费 AI 接吻视频生成器的优势</h3>
            <p className="text-sm text-white/60">了解我们的 AI 接吻视频生成器的优势，看看它是如何从其他 AI 工具中脱颖而出的。</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {content.VALUE_CARDS.map(({ title, description, icon: Icon }: any) => (
              <div
                key={title}
                className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-6 w-6 text-white/80" />
                </div>
                <h4 className="text-lg font-semibold">{title}</h4>
                <p className="text-sm text-white/65 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-center text-2xl md:text-3xl font-semibold">更多免费 AI 视频特效模板</h3>
            <p className="text-sm text-white/60">探索更多灵感，快速切换到其他热门模板继续创作。</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {suggestedEffects.map((item) => (
              <Link
                key={item.slug}
                href={`/video-effects/${item.slug}`}
                className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-black/40 transition hover:border-white/30 hover:shadow-lg hover:shadow-blue-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <video
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    src={item.previewVideoUrl || PLACEHOLDER_VIDEO_URL}
                    muted
                    playsInline
                    loop
                    autoPlay
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/70" />
                  <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-900 opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                    Use This Effect
                  </span>
                </div>
                <div className="px-4 py-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="flex justify-center">
            <Button asChild variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              <Link href="/video-effects">更多特效</Link>
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-center text-2xl md:text-3xl font-semibold">常见问题</h3>
          <div className="mx-auto max-w-3xl space-y-4">
            {content.FAQ_ITEMS.map(({ q, a }: any) => (
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
