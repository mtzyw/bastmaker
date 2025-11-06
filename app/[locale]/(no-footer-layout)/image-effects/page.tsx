import ImageEffectsGallery, {
  type ImageEffectsGalleryItem,
} from "@/components/ai/ImageEffectsGallery";
import Footer from "@/components/footer/Footer";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { listActiveImageEffects } from "@/lib/image-effects/templates";
import { loadImageEffectCopy } from "@/lib/image-effects/content";
import { Metadata } from "next";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

type PageProps = {
  params: Params;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { locale } = await params;

  return constructMetadata({
    page: "ImageEffects",
    title: "AI Image Effects",
    description: "Browse curated AI image effect templates.",
    locale: locale as Locale,
    path: `/image-effects`,
  });
}

export default async function ImageEffectsPage({ params }: PageProps) {
  const { locale } = await params;
  let effects: ImageEffectsGalleryItem[] = [];

  try {
    const templates = await listActiveImageEffects();
    if (templates.length > 0) {
      effects = templates.map((template) => ({
        slug: template.slug,
        title: template.title,
        category: template.category ?? "未分类",
        description: template.description,
        previewImageUrl: template.previewImageUrl ?? undefined,
      }));
    }
  } catch (error) {
    console.error("[image-effects] failed to load templates for gallery", error);
  }

  const localizedEffects = await Promise.all(
    effects.map(async (effect) => {
      const { copy } = await loadImageEffectCopy(effect.slug, locale as Locale);
      return copy?.displayTitle ? { ...effect, title: copy.displayTitle } : effect;
    })
  );

  return (
    <div className="relative w-full text-white">
      <section className="header-bg w-full min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto flex h-full flex-col px-4 pb-16 pt-12 md:px-8">
          <div className="flex-1">
            <ImageEffectsGallery effects={localizedEffects} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
