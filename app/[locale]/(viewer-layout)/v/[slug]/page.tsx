import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ViewerBoard } from "@/components/viewer/ViewerBoard";
import { ViewerHeader } from "@/components/viewer/ViewerHeader";
import {
  SHARE_REFERER_QUERY_KEY,
  SHARE_REFERER_QUERY_VALUE,
} from "@/lib/share/constants";
import { setShareAttributionCookie } from "@/lib/share/cookie";
import { siteConfig } from "@/config/site";
import { DEFAULT_LOCALE, Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { incrementAiJobShareVisit } from "@/actions/ai-jobs/public";

import { getViewerJob } from "./data";

export const dynamic = "force-dynamic";

function buildPath(locale: string, slug: string) {
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  return `${prefix}/v/${slug}`;
}

type RouteParams = Promise<{ locale: string; slug: string }>;
type RouteSearchParams = Promise<Record<string, string | string[] | undefined> | undefined>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = (rawLocale ?? DEFAULT_LOCALE) as Locale;

  try {
    const job = await getViewerJob(slug);
    const images = job.assets
      .map((asset) => {
        if (asset.type === "image") return asset.url;
        return asset.thumbUrl || asset.posterUrl || null;
      })
      .filter((url): url is string => Boolean(url));

    const metaTitle = job.title ?? job.modelLabel ?? job.modalityLabel ?? "AI Creation";
    const metaDescription = job.summary ?? job.prompt ?? undefined;

    const imageList = images.length > 0
      ? images
      : job.fallbackUrl
        ? [job.fallbackUrl]
        : [];

    return constructMetadata({
      page: "Viewer",
      title: metaTitle,
      description: metaDescription,
      images: imageList,
      locale,
      path: buildPath(locale, job.shareSlug),
    });
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) {
      throw error;
    }
    return constructMetadata({
      page: "Viewer",
      title: "AI Artwork",
      locale,
      noIndex: true,
    });
  }
}

export default async function ViewerPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams?: RouteSearchParams;
}) {
  const [{ locale: rawLocale, slug }, resolvedSearch] = await Promise.all([
    params,
    searchParams,
  ]);

  const locale = (rawLocale ?? DEFAULT_LOCALE) as Locale;

  const job = await getViewerJob(slug).catch((error) => {
    if (typeof error === "object" && error && "digest" in error) {
      throw error;
    }
    console.error("[viewer-page] failed to load job", error);
    notFound();
  });

  if (!job) {
    notFound();
  }

  const sharePath = buildPath(locale, job.shareSlug);
  const absoluteShareUrl = `${siteConfig.url}${sharePath}?${SHARE_REFERER_QUERY_KEY}=${SHARE_REFERER_QUERY_VALUE}`;

  const modalityPathMap: Record<string, string> = {
    t2i: "/text-to-image",
    i2i: "/image-to-image",
    t2v: "/text-to-video",
    i2v: "/image-to-video",
  };
  const viewerBasePath = modalityPathMap[job.modality ?? ""] ?? "/text-to-image";
  const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const generateUrl = `${localePrefix}${viewerBasePath}`;

  const sourceParam = resolvedSearch?.[SHARE_REFERER_QUERY_KEY];
  const isShareVisit = Array.isArray(sourceParam)
    ? sourceParam.includes(SHARE_REFERER_QUERY_VALUE)
    : sourceParam === SHARE_REFERER_QUERY_VALUE;

  if (isShareVisit && job.owner) {
    await Promise.allSettled([
      setShareAttributionCookie({
        jobId: job.id,
        ownerId: job.owner.id,
        shareSlug: job.shareSlug,
        locale,
        source: SHARE_REFERER_QUERY_VALUE,
      }).catch((error) => {
        console.error("[viewer-page] failed to set attribution cookie", error);
      }),
      incrementAiJobShareVisit(job.id).catch((error) => {
        console.error("[viewer-page] failed to record share visit", error);
      }),
    ]);
  }

  return (
    <>
      <ViewerHeader job={job} shareUrl={absoluteShareUrl} generateUrl={generateUrl} />
      <main className="px-4 pb-12 pt-4 sm:px-6">
        <ViewerBoard job={job} shareUrl={absoluteShareUrl} />
      </main>
    </>
  );
}
