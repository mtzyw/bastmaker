import PureFourSections, { SectionConfig } from "@/components/sections/PureFourSections";
import { VideoEffectsEditorLeftPanel } from "@/components/ai/VideoEffectsEditorLeftPanel";
import { VideoEffectsEditorPreview } from "@/components/ai/VideoEffectsEditorPreview";
import { VideoEffectsDetailContent } from "@/components/ai/VideoEffectsDetailContent";
import TextToImageRecentTasks from "@/components/ai/TextToImageRecentTasks";
import { Locale, LOCALES } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { createClient } from "@/lib/supabase/server";
import { getVideoEffectBySlug, VIDEO_EFFECTS } from "@/lib/video-effects/effects";
import { fetchVideoEffectTemplate, type VideoEffectTemplate } from "@/lib/video-effects/templates";
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
  const template = await fetchVideoEffectTemplate(slug).catch(() => null);
  const fallbackDefinition = getVideoEffectBySlug(slug);
  const effect = template ?? fallbackDefinition;

  return constructMetadata({
    page: "VideoEffectsDetail",
    title: effect ? `${effect.title} | AI Video Effects` : "AI Video Effects",
    description: effect?.description ?? "Configure AI video effect parameters and preview the result.",
    locale: locale as Locale,
    path: `/video-effects/${slug}`,
  });
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];

  for (const locale of LOCALES) {
    for (const effect of VIDEO_EFFECTS) {
      params.push({ locale, slug: effect.slug });
    }
  }

  return params;
}

export default async function VideoEffectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const template = await fetchVideoEffectTemplate(slug).catch(() => null);
  const fallbackDefinition = getVideoEffectBySlug(slug);
  const effect = template ?? fallbackDefinition;

  if (!effect) {
    notFound();
  }

  const resolvedTemplate: VideoEffectTemplate | null = template
    ? template
    : {
        id: `fallback-${effect.slug}`,
        slug: effect.slug,
        title: effect.title,
        description: effect.description ?? null,
        category: effect.category ?? null,
        previewVideoUrl: null,
        previewCoverUrl: null,
        modalityCode: "i2v",
        providerCode: "freepik",
        providerModel: "",
        durationSeconds: null,
        resolution: null,
        aspectRatio: null,
        mode: null,
        cfgScale: null,
        seed: null,
        pricingCreditsOverride: null,
        defaultPrompt: null,
        negativePrompt: null,
        promptVariables: [],
        metadata: {},
        isActive: true,
        displayOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        inputs: [],
      };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  const shouldShowRecentTasks = effect.slug === "ai-kissing" && isAuthenticated;
  const rightSection = shouldShowRecentTasks ? (
    <TextToImageRecentTasks
      initialCategory="视频"
      categories={["视频", "全部", "图片"]}
      hideEffectBadge
    />
  ) : (
    <VideoEffectsEditorPreview effect={resolvedTemplate} />
  );
  const detailContentEffect =
    fallbackDefinition ??
    ({
      slug: effect.slug,
      title: effect.title,
      category: effect.category ?? undefined,
      description: effect.description ?? undefined,
    } as (typeof VIDEO_EFFECTS)[number]);

  return (
    <PureFourSections
      leftWidth="13"
      section2Split="25/75"
      sections={sections}
      withSidebar={false}
      section2Left={<VideoEffectsEditorLeftPanel effect={resolvedTemplate} />}
      section2Right={rightSection}
      mergedSectionContent={
        shouldShowRecentTasks ? null : <VideoEffectsDetailContent effect={detailContentEffect} />
      }
      hideMergedSection={shouldShowRecentTasks}
    />
  );
}
export const dynamic = "force-dynamic";
