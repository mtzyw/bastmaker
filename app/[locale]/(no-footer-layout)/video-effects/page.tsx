import VideoEffectsGallery, {
  type VideoEffectsGalleryItem,
} from "@/components/ai/VideoEffectsGallery";
import Footer from "@/components/footer/Footer";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { VIDEO_EFFECTS } from "@/lib/video-effects/effects";
import { listActiveVideoEffects } from "@/lib/video-effects/templates";
import { Metadata } from "next";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { locale } = await params;

  return constructMetadata({
    page: "VideoEffects",
    title: "AI Video Effects",
    description: "Browse curated AI video effect templates.",
    locale: locale as Locale,
    path: `/video-effects`,
  });
}

function mapFallbackEffects(): VideoEffectsGalleryItem[] {
  return VIDEO_EFFECTS.map((effect) => ({
    slug: effect.slug,
    title: effect.title,
    category: effect.category,
    description: effect.description,
    previewVideoUrl: null,
    previewCoverUrl: null,
  }));
}

export default async function VideoEffectsPage() {
  let effects: VideoEffectsGalleryItem[] = [];

  try {
    const templates = await listActiveVideoEffects();
    if (templates.length > 0) {
      effects = templates.map((template) => ({
        slug: template.slug,
        title: template.title,
        category: template.category ?? "未分类",
        description: template.description,
        previewVideoUrl: template.previewVideoUrl ?? undefined,
        previewCoverUrl: template.previewCoverUrl ?? undefined,
      }));
    }
  } catch (error) {
    console.error("[video-effects] failed to load templates for gallery", error);
  }

  if (effects.length === 0) {
    effects = mapFallbackEffects();
  }

  return (
    <div className="relative w-full text-white">
      <section className="header-bg w-full min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto flex h-full flex-col px-4 pb-16 pt-12 md:px-8">
          <div className="flex-1">
            <VideoEffectsGallery effects={effects} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
