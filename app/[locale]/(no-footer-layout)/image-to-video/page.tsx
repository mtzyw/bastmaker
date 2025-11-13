import PureFourSections, { SectionConfig } from "@/components/sections/PureFourSections";
import ImageToVideoLeftPanel from "@/components/ai/ImageToVideoLeftPanel";
import TextToImageRecentTasks from "@/components/ai/TextToImageRecentTasks";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;

  return constructMetadata({
    page: "ImageToVideo",
    title: "Image to Video",
    description: "Pure color layout with Footer inside Section 4.",
    locale: locale as Locale,
    path: `/image-to-video`,
  });
}

const sections: [SectionConfig, SectionConfig, SectionConfig, SectionConfig] = [
  { id: "s1", bg: "#0B0F1A", fg: "#ffffff", title: "Section 1" },
  { id: "s2", bg: "#111827", fg: "#ffffff", title: "Section 2" },
  { id: "s3", bg: "#1F2937", fg: "#ffffff", title: "Section 3" },
  { id: "s4", bg: "#0F172A", fg: "#ffffff", title: "Section 4" },
];

export default async function ImageToVideoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  return (
    <PureFourSections
      leftWidth="13"
      section2Split="25/75"
      sections={sections}
      withSidebar={false}
      section2Left={<ImageToVideoLeftPanel />}
      section2Right={
        <TextToImageRecentTasks
          initialCategory="视频"
          categories={["视频", "全部", "图片", "音效"]}
          hideEffectBadge
          fallbackMediaUrl="https://static.bestmaker.ai/imgae/imagetoimage.png"
        />
      }
      hideMergedSection={isAuthenticated}
    />
  );
}

export const dynamic = "force-dynamic";
