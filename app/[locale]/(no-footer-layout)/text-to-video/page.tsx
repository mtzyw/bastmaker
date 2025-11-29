import PureFourSections, { SectionConfig } from "@/components/sections/PureFourSections";
import TextToVideoLeftPanel from "@/components/ai/TextToVideoLeftPanel";
import TextToImageRecentTasks from "@/components/ai/TextToImageRecentTasks";
import TextToVideoGuestPreview from "@/components/ai/TextToVideoGuestPreview";
import { HideIfAuthenticated } from "@/components/auth/HideIfAuthenticated";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TextToVideoPage" });

  return constructMetadata({
    page: "TextToVideo",
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale: locale as Locale,
    path: `/text-to-video`,
  });
}

const BASE_SECTIONS: [SectionConfig, SectionConfig, SectionConfig, SectionConfig] = [
  { id: "s1", bg: "#0B0F1A", fg: "#ffffff", title: "Section 1" },
  { id: "s2", bg: "#111827", fg: "#ffffff", title: "Section 2" },
  { id: "s3", bg: "#1F2937", fg: "#ffffff", title: "Section 3" },
  { id: "s4", bg: "#0F172A", fg: "#ffffff", title: "Section 4" },
];

export default async function TextToVideoPage() {
  const t = await getTranslations("TextToVideoPage");
  const rawOverviewPoints = t.raw("sections.overview.points");
  const overviewPoints = Array.isArray(rawOverviewPoints) ? (rawOverviewPoints as OverviewPoint[]) : [];
  const rawSeoHighlights = t.raw("sections.seo.highlights");
  const seoHighlights = Array.isArray(rawSeoHighlights) ? (rawSeoHighlights as string[]) : [];
  const sections: [SectionConfig, SectionConfig, SectionConfig, SectionConfig] = BASE_SECTIONS.map(
    (section, index) => {
      if (index === 2) {
        return { ...section, title: t("sections.overview.title") };
      }
      if (index === 3) {
        return { ...section, title: t("sections.seo.title") };
      }
      return section;
    },
  ) as [SectionConfig, SectionConfig, SectionConfig, SectionConfig];
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
      section2Left={<TextToVideoLeftPanel />}
      section2Right={
        isAuthenticated ? (
          <TextToImageRecentTasks
            initialCategory="视频"
            categories={["视频", "全部", "图片", "音效"]}
            hideEffectBadge
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <TextToVideoGuestPreview />
          </div>
        )
      }
      mergedSectionContent={
        isAuthenticated ? null : (
          <HideIfAuthenticated>
            <TextToVideoSeoContent
              badgeLabel={t("metaTitle")}
              overviewTitle={t("sections.overview.title")}
              overviewBody={t("sections.overview.body")}
              overviewPoints={overviewPoints}
              seoTitle={t("sections.seo.title")}
              seoBody={t("sections.seo.body")}
              seoHighlights={seoHighlights}
            />
          </HideIfAuthenticated>
        )
      }
      hideMergedSection={isAuthenticated}
    />
  );
}

export const dynamic = "force-dynamic";

type OverviewPoint = {
  title: string;
  description: string;
};

type TextToVideoSeoContentProps = {
  badgeLabel: string;
  overviewTitle: string;
  overviewBody: string;
  overviewPoints: OverviewPoint[];
  seoTitle: string;
  seoBody: string;
  seoHighlights: string[];
};

function TextToVideoSeoContent({
  badgeLabel,
  overviewTitle,
  overviewBody,
  overviewPoints,
  seoTitle,
  seoBody,
  seoHighlights,
}: TextToVideoSeoContentProps) {
  return (
    <div className="container mx-auto px-4 md:px-8 py-16 space-y-14">
      <section className="space-y-6">
        <div className="max-w-4xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
            {badgeLabel}
          </p>
          <h2 className="text-3xl font-semibold text-white">
            {overviewTitle}
          </h2>
          <p className="text-base leading-relaxed text-white/80">
            {overviewBody}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {overviewPoints.map((point) => (
            <article
              key={point.title}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/0 to-white/5 p-5 shadow-[0_10px_45px_rgba(0,0,0,0.3)]"
            >
              <h3 className="text-xl font-semibold text-white">{point.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/75">{point.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="max-w-4xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
            {seoTitle}
          </p>
          <h3 className="text-3xl font-semibold text-white">{seoTitle}</h3>
          <p className="text-base leading-relaxed text-white/80">{seoBody}</p>
        </div>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {seoHighlights.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-relaxed text-white/80"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
