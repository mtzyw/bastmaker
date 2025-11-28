import { ImageEffectsDetailContent } from "@/components/ai/ImageEffectsDetailContent";
import { ImageEffectsEditorLeftPanel } from "@/components/ai/ImageEffectsEditorLeftPanel";
import TextToImageRecentTasks from "@/components/ai/TextToImageRecentTasks";
import { HideIfAuthenticated } from "@/components/auth/HideIfAuthenticated";
import PureFourSections, { SectionConfig } from "@/components/sections/PureFourSections";
import { Locale, LOCALES } from "@/i18n/routing";
import { loadImageEffectCopy } from "@/lib/image-effects/content";
import { getImageEffectBySlug, IMAGE_EFFECTS } from "@/lib/image-effects/effects";
import {
  fetchImageEffectTemplate,
  listActiveImageEffects,
  type ImageEffectTemplate,
} from "@/lib/image-effects/templates";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { notFound } from "next/navigation";

type Params = Promise<{ locale: string; slug: string }>;

type PageProps = {
  params: Params;
};

type MetadataProps = {
  params: Params;
};

const sections: [SectionConfig, SectionConfig, SectionConfig, SectionConfig] = [
  { id: "s1", bg: "#0B0F1A", fg: "#ffffff", title: "Section 1" },
  { id: "s2", bg: "#111827", fg: "#ffffff", title: "Section 2" },
  { id: "s3", bg: "#1F2937", fg: "#ffffff", title: "Section 3" },
  { id: "s4", bg: "#0F172A", fg: "#ffffff", title: "Section 4" },
];

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const template = await fetchImageEffectTemplate(slug).catch(() => null);
  const fallbackDefinition = getImageEffectBySlug(slug);
  const effect = template ?? fallbackDefinition;
  const { copy } = await loadImageEffectCopy(slug, locale as Locale);

  return constructMetadata({
    page: "ImageEffectsDetail",
    title:
      copy?.seoTitle ??
      (effect ? `${effect.title} | AI Image Effects` : "AI Image Effects"),
    description:
      copy?.seoDescription ??
      effect?.description ??
      "Configure AI image effect parameters and preview the result.",
    locale: locale as Locale,
    path: `/image-effects/${slug}`,
  });
}

export async function generateStaticParams() {
  try {
    const templates = await listActiveImageEffects();
    if (templates.length > 0) {
      return templates.flatMap(({ slug }) =>
        LOCALES.map((locale) => ({ locale, slug }))
      );
    }
  } catch (error) {
    console.error("[image-effects] failed to build static params from Supabase", error);
  }

  return LOCALES.flatMap((locale) =>
    IMAGE_EFFECTS.map(({ slug }) => ({ locale, slug }))
  );
}

export default async function ImageEffectDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const [template, allEffects] = await Promise.all([
    fetchImageEffectTemplate(slug).catch(() => null),
    listActiveImageEffects().catch(() => []),
  ]);

  const fallbackDefinition = getImageEffectBySlug(slug);
  const effectDefinition = template ?? fallbackDefinition;

  if (!effectDefinition) {
    notFound();
  }

  const resolvedTemplate: ImageEffectTemplate = template
    ? template
    : {
      id: `fallback-${effectDefinition.slug}`,
      slug: effectDefinition.slug,
      title: effectDefinition.title,
      description: effectDefinition.description ?? null,
      category: effectDefinition.category ?? null,
      previewImageUrl: null,
      providerCode: "freepik",
      providerModel: "",
      pricingCreditsOverride: null,
      promptVariables: [],
      metadata: {},
      isActive: true,
      displayOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inputs: [],
    };

  const { copy } = await loadImageEffectCopy(slug, locale as Locale);
  const localizedTemplate: ImageEffectTemplate =
    copy?.displayTitle && resolvedTemplate.title !== copy.displayTitle
      ? { ...resolvedTemplate, title: copy.displayTitle }
      : resolvedTemplate;

  const fallbackEffects: ImageEffectTemplate[] = IMAGE_EFFECTS.map((item) => ({
    id: `fallback-${item.slug}`,
    slug: item.slug,
    title: item.title,
    description: item.description ?? null,
    category: item.category ?? null,
    previewImageUrl: null,
    providerCode: "freepik",
    providerModel: "",
    pricingCreditsOverride: null,
    promptVariables: [],
    metadata: {},
    isActive: true,
    displayOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inputs: [],
  }));

  const sourceEffects = allEffects.length > 0 ? allEffects : fallbackEffects;

  const localizedAllEffects: ImageEffectTemplate[] = await Promise.all(
    sourceEffects.map(async (item) => {
      if (item.slug === localizedTemplate.slug && copy?.displayTitle) {
        return { ...item, title: copy.displayTitle };
      }
      const { copy: itemCopy } = await loadImageEffectCopy(item.slug, locale as Locale);
      return itemCopy?.displayTitle ? { ...item, title: itemCopy.displayTitle } : item;
    })
  );

  const previewMediaUrl =
    resolvedTemplate.metadata?.pageContent?.previewImageUrl ||
    resolvedTemplate.metadata?.pageContent?.detailImageUrls?.[0] ||
    resolvedTemplate.previewImageUrl ||
    "https://cdn.bestmaker.ai/static/placeholders/image-effect-detail.jpg";

  const rightSection = (
    <TextToImageRecentTasks
      initialCategory="图片"
      categories={["图片", "特效", "全部"]}
      hideEffectBadge
      fallbackMediaUrl={previewMediaUrl}
    />
  );

  return (
    <PureFourSections
      leftWidth="13"
      section2Split="25/75"
      sections={sections}
      withSidebar={false}
      section2Left={<ImageEffectsEditorLeftPanel effect={localizedTemplate} />}
      section2Right={rightSection}
      mergedSectionContent={
        <HideIfAuthenticated>
          <ImageEffectsDetailContent
            effect={localizedTemplate}
            allEffects={localizedAllEffects}
            copy={copy}
          />
        </HideIfAuthenticated>
      }
      hideMergedSection={false}
    />
  );
}
export const dynamic = "force-dynamic";
