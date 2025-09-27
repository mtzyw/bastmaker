import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";

import { getPublicProfileBySlug } from "@/actions/ai-jobs/public";
import type { PublicProfileJob, ViewerJobAsset } from "@/actions/ai-jobs/public";
import { constructMetadata } from "@/lib/metadata";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function buildProfilePath(locale: string, slug: string) {
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  return `${prefix}/profile/${slug}`;
}

function buildViewerPath(locale: string, shareSlug: string) {
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  return `${prefix}/v/${shareSlug}`;
}

function formatDate(dateString: string, locale: string) {
  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return formatter.format(new Date(dateString));
  } catch (error) {
    return new Date(dateString).toLocaleDateString();
  }
}

function MediaPreview({ asset }: { asset: ViewerJobAsset }) {
  if (asset.type === "video") {
    return (
      <video
        src={asset.url}
        poster={asset.posterUrl ?? asset.thumbUrl ?? undefined}
        muted
        loop
        playsInline
        className="h-full w-full rounded-xl object-cover"
      />
    );
  }

  return (
    <Image
      src={asset.url}
      alt={asset.alt ?? "Artwork"}
      fill
      className="rounded-xl object-cover"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      priority={false}
    />
  );
}

function JobCard({ job, locale }: { job: PublicProfileJob; locale: string }) {
  const href = buildViewerPath(locale, job.shareSlug);
  const formattedDate = formatDate(job.createdAt, locale);

  return (
    <a
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur transition hover:-translate-y-1 hover:border-white/20"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <MediaPreview asset={job.coverAsset} />
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pb-5 pt-4">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>{formattedDate}</span>
          {job.modalityLabel ? <Badge variant="secondary" className="bg-white/10 text-white/70">{job.modalityLabel}</Badge> : null}
        </div>
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-base font-semibold text-white">
            {job.title ?? job.modelLabel ?? "Untitled"}
          </h3>
          {job.summary ? (
            <p className="line-clamp-2 text-sm text-white/60">{job.summary}</p>
          ) : null}
        </div>
        <div className="mt-auto flex items-center justify-between text-xs text-white/50">
          <span>{job.modelLabel ?? ""}</span>
          <div className="flex items-center gap-3">
            <span>👁️ {job.stats.visits}</span>
            <span>✨ {job.stats.conversions}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-white/60">
      <h3 className="text-lg font-semibold text-white/80">暂时还没有公开作品</h3>
      <p className="max-w-md text-sm">开启作品的公开选项后，它们会出现在这里，供所有人浏览。</p>
    </div>
  );
}

function ProfileHeader({
  locale,
  slug,
  jobCount,
  displayName,
  avatarUrl,
}: {
  locale: string;
  slug: string;
  jobCount: number;
  displayName: string | null;
  avatarUrl: string | null;
}) {
  const initials = displayName?.slice(0, 1)?.toUpperCase() ?? slug.slice(0, 1).toUpperCase();

  return (
    <header className="flex flex-col items-center gap-6 text-center">
      <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/20 bg-white/10">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName ?? slug}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white/80">
            {initials}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">{displayName ?? slug}</h1>
        <p className="text-white/60">公开作品 {jobCount} 件</p>
      </div>
      <div className="flex items-center gap-3 text-sm text-white/60">
        <span>个人主页</span>
        <code className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
          {buildProfilePath(locale, slug)}
        </code>
      </div>
    </header>
  );
}

function buildMetadataTitle(name?: string | null) {
  return name ? `${name} · Nexty Gallery` : "创作者主页 · Nexty";
}

type RouteParams = Promise<{ locale: string; slug: string }>;
type RouteSearchParams = Promise<Record<string, string | string[] | undefined> | undefined>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  const profileResult = await getPublicProfileBySlug(slug, { page: 0, pageSize: 1 });

  if (!profileResult.success || !profileResult.data) {
    return constructMetadata({
      page: "Profile",
      title: "创作者主页",
      locale: locale,
      path: buildProfilePath(locale, slug),
      noIndex: true,
    });
  }

  const profile = profileResult.data.user;

  return constructMetadata({
    page: "Profile",
    title: buildMetadataTitle(profile.displayName ?? profile.slug),
    description: profileResult.data.totalCount
      ? `浏览 ${profile.displayName ?? profile.slug} 的 ${profileResult.data.totalCount} 件公开作品`
      : `${profile.displayName ?? profile.slug} 的创作者主页`,
    locale: locale,
    path: buildProfilePath(locale, profile.slug),
  });
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams?: RouteSearchParams;
}) {
  const [{ locale, slug }, resolvedSearch] = await Promise.all([params, searchParams]);

  const pageParam = resolvedSearch?.page;
  const parsedPage = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const currentPage = parsedPage ? Math.max(0, Number.parseInt(parsedPage, 10) || 0) : 0;

  const profileResult = await getPublicProfileBySlug(slug, { page: currentPage, pageSize: 12 });

  if (!profileResult.success || !profileResult.data) {
    notFound();
  }

  const { user, jobs, hasMore } = profileResult.data;

  return (
    <main className="px-4 pb-16 pt-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 text-white">
        <ProfileHeader
          locale={locale}
          slug={user.slug}
          jobCount={profileResult.data.totalCount}
          displayName={user.displayName}
          avatarUrl={user.avatarUrl}
        />

        {jobs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} locale={locale} />
            ))}
          </div>
        )}

        {hasMore ? (
          <div className="flex justify-center">
            <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15">
              <a href={`${buildProfilePath(locale, user.slug)}?page=${currentPage + 1}`}>
                加载更多
              </a>
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
