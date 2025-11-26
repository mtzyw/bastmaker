import { notFound } from "next/navigation";

import { ViewerBoard } from "@/components/viewer/ViewerBoard";
import { ViewerModal } from "@/components/viewer/ViewerModal";
import {
  SHARE_REFERER_QUERY_KEY,
  SHARE_REFERER_QUERY_VALUE,
} from "@/lib/share/constants";
import { setShareAttributionCookie } from "@/lib/share/cookie";
import { siteConfig } from "@/config/site";
import { DEFAULT_LOCALE, Locale } from "@/i18n/routing";
import { incrementAiJobShareVisit } from "@/actions/ai-jobs/public";

import { getViewerJob } from "@/app/[locale]/(viewer-layout)/v/[slug]/data";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ locale: string; slug: string }>;
type RouteSearchParams = Promise<Record<string, string | string[] | undefined> | undefined>;

export default async function ViewerModalPage({
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
    console.error("[viewer-modal] failed to load job", error);
    notFound();
  });

  if (!job) {
    notFound();
  }

  const resolvedShareSlug = job.shareSlug || slug;
  const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const sharePath = `${localePrefix}/v/${resolvedShareSlug}`;
  const absoluteShareUrl = `${siteConfig.url}${sharePath}?${SHARE_REFERER_QUERY_KEY}=${SHARE_REFERER_QUERY_VALUE}`;

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
        console.error("[viewer-modal] failed to set attribution cookie", error);
      }),
      incrementAiJobShareVisit(job.id).catch((error) => {
        console.error("[viewer-modal] failed to record share visit", error);
      }),
    ]);
  }

  return (
    <ViewerModal>
      <div className="md:h-auto md:max-h-[80vh] md:overflow-auto">
        <ViewerBoard job={job} shareUrl={absoluteShareUrl} localePrefix={localePrefix} />
      </div>
    </ViewerModal>
  );
}
