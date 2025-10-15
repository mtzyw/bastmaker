import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VideoEffectCopy } from "@/lib/video-effects/content";
import { getVideoEffectContent } from "@/config/video-effects-content";
import { VideoEffectTemplate } from "@/lib/video-effects/templates";
import type { LucideIcon } from "lucide-react";
import { Award, Layers, Smile } from "lucide-react";

const PLACEHOLDER_VIDEO_URL =
  "https://cdn.bestmaker.ai/tasks/10a81006-480e-4ccf-ba60-c9887e2be6f8/0.mp4";

const ICON_MAP: Record<string, LucideIcon> = {
  Smile,
  Award,
  Layers,
};

type ValueCard = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

type FeatureItem = {
  title: string;
  description?: string;
  ctaLabel: string;
  ctaHref: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

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
  allEffects,
  copy,
}: {
  effect: VideoEffectTemplate;
  allEffects: VideoEffectTemplate[];
  copy?: VideoEffectCopy | null;
}) {
  const suggestedEffects = getSuggestedEffects(effect.slug, allEffects);
  const displayTitle = copy?.displayTitle ?? effect.title;
  const legacyContent = copy ? null : getVideoEffectContent(effect.slug);
  const pageContent = effect.metadata?.pageContent;

  const detailVideoUrls =
    pageContent?.detailVideoUrls?.length === 7
      ? pageContent.detailVideoUrls
      : Array(7).fill(PLACEHOLDER_VIDEO_URL);

  const heroHeading =
    copy?.hero?.heading ?? `免费 ${displayTitle} 在线生成器`;
  const heroDescription =
    copy?.hero?.description ??
    `使用 ${displayTitle} 模板，快速打造真实自然的亲密互动镜头。AI 自动处理动作衔接、光效和情绪细节，帮助短视频创作者、情感类账号和品牌营销迅速完成高质量作品。`;
  const heroCtaLabel = copy?.hero?.cta?.label ?? "立即开始创作";
  const heroCtaHref = copy?.hero?.cta?.href ?? "#";

  const galleryHeading = copy?.gallery?.heading ?? "精选案例预览";
  const gallerySubheading =
    copy?.gallery?.subheading ??
    "探索更多灵感，快速切换到其他热门模板继续创作。";
  const galleryItems =
    copy?.galleryItems ??
    legacyContent?.GALLERY_ITEMS?.map((item: any) => ({
      title: item.title,
      description: item.description,
    })) ??
    [];

  const featureItems: FeatureItem[] = (copy?.features?.items ??
    legacyContent?.IMMERSIVE_FEATURES ??
    []
  ).map((item: any) => ({
    title: item.title,
    description: item.description,
    ctaLabel:
      item.ctaLabel ??
      heroCtaLabel,
    ctaHref: item.ctaHref ?? "#",
  }));

  const valueHeading =
    copy?.valueProps?.heading ?? `我们的免费 ${displayTitle} 的优势`;
  const valueDescription =
    copy?.valueProps?.description ??
    `了解我们的 ${displayTitle} 的优势，看看它是如何从其他 AI 工具中脱颖而出的。`;
  const valueItems: ValueCard[] = (copy?.valueProps?.items ??
    legacyContent?.VALUE_CARDS ??
    []
  ).map((item: any) => {
    if (typeof item.icon === "string") {
      const Icon = ICON_MAP[item.icon] ?? Smile;
      return { title: item.title, description: item.description, Icon };
    }
    const Icon = (item.icon as LucideIcon | undefined) ?? Smile;
    return { title: item.title, description: item.description, Icon };
  });

  const moreEffectsHeading =
    copy?.moreEffects?.heading ?? "更多免费 AI 视频特效模板";
  const moreEffectsDescription =
    copy?.moreEffects?.description ??
    "探索更多灵感，快速切换到其他热门模板继续创作。";
  const moreEffectsLinkLabel = copy?.moreEffects?.linkLabel ?? "更多特效";

  const faqHeading = copy?.faq?.heading ?? "常见问题";
  const faqItems: FaqItem[] = copy?.faq?.items
    ? copy.faq.items
    : (legacyContent?.FAQ_ITEMS ?? []).map((item: any) => ({
        question: item.q,
        answer: item.a,
      }));

  return (
    <div className="header-bg text-white">
      <div className="container mx-auto space-y-16 px-4 py-16 md:px-8">
        <section className="space-y-4 text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">{heroHeading}</h2>
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-white/70 md:text-base">
            {heroDescription}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-white text-gray-900 hover:bg-white/90"
            >
              <a href={heroCtaHref}>{heroCtaLabel}</a>
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-semibold md:text-3xl">
              {galleryHeading}
            </h3>
            {gallerySubheading && (
              <p className="text-sm text-white/60">{gallerySubheading}</p>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {galleryItems.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
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
          {featureItems.map((feature, index) => {
            const isReverse = index % 2 !== 0;
            return (
              <div
                key={feature.title}
                className={cn(
                  "grid items-center gap-10",
                  "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]",
                  isReverse &&
                    "lg:[&>*:first-child]:col-start-2 lg:[&>*:last-child]:col-start-1 lg:[&>*]:row-start-1"
                )}
              >
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold md:text-3xl">
                    {feature.title}
                  </h3>
                  {feature.description && (
                    <p className="text-sm leading-relaxed text-white/70">
                      {feature.description}
                    </p>
                  )}
                  <a
                    href={feature.ctaHref}
                    className="relative inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold"
                  >
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-lime-400 via-pink-500 to-purple-500 opacity-80 blur-[2px]" />
                    <span className="absolute inset-[1px] rounded-full bg-black" />
                    <span className="relative text-white">
                      {feature.ctaLabel}
                    </span>
                  </a>
                </div>
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                  <video
                    className="aspect-[4/3] w-full object-cover md:aspect-video"
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
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-semibold md:text-3xl">
              {valueHeading}
            </h3>
            <p className="text-sm text-white/60">{valueDescription}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {valueItems.map(({ title, description, Icon }) => (
              <div
                key={title}
                className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-6 w-6 text-white/80" />
                </div>
                <h4 className="text-lg font-semibold">{title}</h4>
                <p className="text-sm leading-relaxed text-white/65">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-semibold md:text-3xl">
              {moreEffectsHeading}
            </h3>
            <p className="text-sm text-white/60">{moreEffectsDescription}</p>
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
                  <p className="text-sm font-semibold text-white">
                    {item.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="flex justify-center">
            <Button
              asChild
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/video-effects">{moreEffectsLinkLabel}</Link>
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-center text-2xl font-semibold md:text-3xl">
            {faqHeading}
          </h3>
          <div className="mx-auto max-w-3xl space-y-4">
            {faqItems.map(({ question, answer }) => (
              <div
                key={question}
                className="rounded-2xl border border-white/10 bg-black/40 p-5"
              >
                <p className="font-semibold text-white">{question}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  {answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
