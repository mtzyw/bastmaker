import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ImageEffectTemplate } from "@/lib/image-effects/templates";
import type { ImageEffectCopy } from "@/lib/image-effects/content";
import { getImageEffectContent } from "@/config/image-effects-content";
import { getVideoEffectContent } from "@/config/video-effects-content";
import type { LucideIcon } from "lucide-react";
import { Sparkles, Palette, Camera } from "lucide-react";

const PLACEHOLDER_IMAGE =
  "https://cdn.bestmaker.ai/static/placeholders/image-effect-detail.jpg";

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Palette,
  Camera,
};

function extractAnchorId(href?: string | null) {
  if (!href || !href.startsWith("#")) {
    return null;
  }
  const id = href.slice(1).trim();
  return id.length > 0 ? id : null;
}

function getSuggestedEffects(
  currentSlug: string,
  allEffects: ImageEffectTemplate[]
): ImageEffectTemplate[] {
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

type GalleryItem = {
  title: string;
  description?: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

export function ImageEffectsDetailContent({
  effect,
  allEffects,
  copy,
}: {
  effect: ImageEffectTemplate;
  allEffects: ImageEffectTemplate[];
  copy?: ImageEffectCopy | null;
}) {
  const suggestedEffects = getSuggestedEffects(effect.slug, allEffects);
  const displayTitle = copy?.displayTitle ?? effect.title;
  const legacyContent = copy ? null : getImageEffectContent(effect.slug);
  const pageContent = effect.metadata?.pageContent;

  const galleryImageUrls =
    pageContent?.detailImageUrls?.length === 6
      ? pageContent.detailImageUrls
      : Array(6).fill(effect.previewImageUrl ?? PLACEHOLDER_IMAGE);

  const heroHeading = copy?.hero?.heading ?? `免费 ${displayTitle} 在线特效`;
  const heroDescription =
    copy?.hero?.description ??
    `上传照片即可套用 ${displayTitle} 模板，AI 自动优化光影与细节，适合电商、影棚与社交媒体创作。`;
  const heroCtaLabel = copy?.hero?.cta?.label ?? "立即开始体验";
  const heroCtaHref = copy?.hero?.cta?.href ?? "#";

  const galleryHeading = copy?.gallery?.heading ?? "效果预览";
  const gallerySubheading =
    copy?.gallery?.subheading ??
    "查看不同风格的生成案例，快速评估模板是否适合你的项目。";
  const galleryItems: GalleryItem[] =
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
    ctaLabel: item.ctaLabel ?? heroCtaLabel,
    ctaHref: item.ctaHref ?? "#",
  }));

  const valueHeading =
    copy?.valueProps?.heading ?? `我们的 ${displayTitle} 模板优势`;
  const valueDescription =
    copy?.valueProps?.description ??
    `结合风格化调色与智能修复，帮助你在几秒内获得高质感的图片。`;
  const valueItems: ValueCard[] = (copy?.valueProps?.items ??
    legacyContent?.VALUE_CARDS ??
    []
  ).map((item: any) => {
    if (typeof item.icon === "string") {
      const Icon = ICON_MAP[item.icon] ?? Sparkles;
      return { title: item.title, description: item.description, Icon };
    }
    const Icon = (item.icon as LucideIcon | undefined) ?? Sparkles;
    return { title: item.title, description: item.description, Icon };
  });

  const moreEffectsHeading =
    copy?.moreEffects?.heading ?? "更多热门图片特效模板";
  const moreEffectsDescription =
    copy?.moreEffects?.description ??
    "探索其他风格模板，快速构建属于你的 AI 作品集。";
  const moreEffectsLinkLabel = copy?.moreEffects?.linkLabel ?? "浏览全部特效";

  const faqHeading = copy?.faq?.heading ?? "常见问题";
  const shouldUseVideoFaq = effect.slug === "3d-figurine-image-generation";
  const fallbackFaqSource = shouldUseVideoFaq
    ? getVideoEffectContent("ai-hugging")?.FAQ_ITEMS
    : legacyContent?.FAQ_ITEMS;

  const faqItems: FaqItem[] = copy?.faq?.items
    ? copy.faq.items
    : (fallbackFaqSource ?? []).map((item: any) => ({
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
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={galleryImageUrls[index] ?? PLACEHOLDER_IMAGE}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 border border-white/10" />
                </div>
                <div className="space-y-1 px-4 py-3">
                  <h4 className="text-sm font-semibold">{item.title}</h4>
                  {item.description ? (
                    <p className="text-xs text-white/60">{item.description}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        {featureItems.length > 0 ? (
          <section className="space-y-14">
            {featureItems.map((feature, index) => {
              const isReverse = index % 2 !== 0;
              const anchorId = extractAnchorId(feature.ctaHref);
              const safeAnchorId =
                anchorId && anchorId !== "editor" ? anchorId : null;
              return (
                <div
                  key={feature.title}
                  id={safeAnchorId ?? undefined}
                  className={cn(
                    "grid items-center gap-10 scroll-mt-24",
                    "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]",
                    isReverse &&
                      "lg:[&>*:first-child]:col-start-2 lg:[&>*:last-child]:col-start-1 lg:[&>*]:row-start-1"
                  )}
                >
                  <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                    <Image
                      src={galleryImageUrls[index] ?? PLACEHOLDER_IMAGE}
                      alt={feature.title}
                      fill
                      className="object-cover scale-125"
                    />
                    <div className="pointer-events-none absolute inset-0 border border-white/10" />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-2xl font-semibold md:text-3xl">
                      {feature.title}
                    </h4>
                    {feature.description ? (
                      <p className="text-sm leading-relaxed text-white/70">
                        {feature.description}
                      </p>
                    ) : null}
                    <Button asChild variant="secondary" size="lg">
                      <Link href={feature.ctaHref}>{feature.ctaLabel}</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </section>
        ) : null}

        <section className="space-y-6">
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-semibold md:text-3xl">{valueHeading}</h3>
            <p className="text-sm text-white/60">{valueDescription}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {valueItems.map(({ title, description, Icon }) => (
              <article
                key={title}
                className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-6 w-6 text-white/80" />
                </div>
                <h4 className="text-lg font-semibold">{title}</h4>
                <p className="text-sm text-white/65">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-semibold md:text-3xl">
              {moreEffectsHeading}
            </h3>
            <p className="text-sm text-white/60">{moreEffectsDescription}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {suggestedEffects.map((item) => (
              <Link
                key={item.id}
                href={`/image-effects/${item.slug}`}
                className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-black/40 transition hover:border-white/30 hover:shadow-lg hover:shadow-blue-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={item.previewImageUrl ?? PLACEHOLDER_IMAGE}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/70" />
                  <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-900 opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                    查看模板
                  </span>
                </div>
                <div className="px-4 py-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  {item.category ? (
                    <p className="text-xs text-white/50">{item.category}</p>
                  ) : null}
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
              <Link href="/image-effects">{moreEffectsLinkLabel}</Link>
            </Button>
          </div>
        </section>

        {faqItems.length > 0 ? (
          <section className="space-y-6">
            <h3 className="text-2xl font-semibold md:text-3xl text-center">
              {faqHeading}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {faqItems.map((faq) => (
                <article
                  key={faq.question}
                  className="rounded-2xl border border-white/10 bg-black/40 p-5"
                >
                  <p className="text-sm font-semibold text-white">
                    {faq.question}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
