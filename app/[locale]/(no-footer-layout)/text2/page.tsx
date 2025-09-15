import PureFourSections, { SectionConfig } from "@/components/sections/PureFourSections";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
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
    page: "Text2",
    title: "Text 2",
    description: "Variant of pure color layout; footer inside Section 4.",
    locale: locale as Locale,
    path: `/text2`,
  });
}

const sections: [SectionConfig, SectionConfig, SectionConfig, SectionConfig] = [
  { id: "s1", bg: "#0A0F1E", fg: "#ffffff", title: "S1" },
  { id: "s2", bg: "#0E172A", fg: "#ffffff", title: "S2" },
  { id: "s3", bg: "#111827", fg: "#ffffff", title: "S3" },
  { id: "s4", bg: "#0B1220", fg: "#ffffff", title: "S4" },
];

export default function Text2Page() {
  return (
    <PureFourSections leftWidth="13" section2Split="25/75" sections={sections} />
  );
}

