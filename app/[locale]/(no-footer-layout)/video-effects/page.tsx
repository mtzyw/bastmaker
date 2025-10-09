import VideoEffectsGallery from "@/components/ai/VideoEffectsGallery";
import Footer from "@/components/footer/Footer";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
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

export default function VideoEffectsPage() {
  return (
    <div className="relative w-full text-white">
      <section className="header-bg w-full min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto flex h-full flex-col px-4 pb-16 pt-12 md:px-8">
          <div className="flex-1">
            <VideoEffectsGallery />
          </div>
        </div>
      </section>

      <section className="w-full min-h-screen lg:min-h-[calc(100vh-4rem)] flex items-center header-bg text-white">
        <div className="w-full">
          <div className="container mx-auto px-4 md:px-8 py-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Section 3</h2>
            <p className="text-sm opacity-80 mb-8">Pure color block (merged with Section 4).</p>
            <h3 className="text-xl font-semibold mb-4">Section 4</h3>
            <p className="text-sm opacity-80 mb-10">Footer is embedded below in the merged section.</p>
          </div>
          <Footer />
        </div>
      </section>
    </div>
  );
}
