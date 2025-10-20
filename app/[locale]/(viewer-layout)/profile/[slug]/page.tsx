import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getPublicProfileBySlug } from "@/actions/ai-jobs/public";
import type { PublicProfileJob, ViewerJobAsset } from "@/actions/ai-jobs/public";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";
import { Palette, Sparkles } from "lucide-react";

function buildProfilePath(locale: string, slug: string) {
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  return `${prefix}/profile/${slug}`;
}

import { ProfileJobCard } from "@/components/ai/ProfileJobCard";

function buildViewerPath(locale: string, shareSlug: string) {
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  return `${prefix}/v/${shareSlug}`;
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
  const handle = slug.startsWith("@") ? slug : `@${slug}`;

  return (
    <header className="relative overflow-hidden rounded-[28px] border border-white/10 header-bg px-8 py-9 shadow-2xl">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/20 bg-white/5 shadow-lg">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName ?? slug}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white/80">
                {initials}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-wide text-white md:text-4xl">
                {displayName ?? slug}
              </h1>
              <p className="text-sm text-white/60">{handle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm">
                <Palette className="h-4 w-4" />
                {jobCount} 件作品
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm">
                <Sparkles className="h-4 w-4" />
                公开展示
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-[#ff4d8d] to-[#ff6a5f] px-6 text-sm font-semibold text-white shadow-lg hover:from-[#ff5aa0] hover:to-[#ff7c6f]"
          >
            <I18nLink href="/dashboard/settings" prefetch>
              编辑资料
            </I18nLink>
          </Button>
        </div>
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

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "image", label: "图片" },
  { key: "video", label: "视频" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function buildFilterLink(locale: string, slug: string, page: number, filter: FilterKey) {
  const params = new URLSearchParams();
  if (page > 0) params.set("page", String(page));
  if (filter !== "all") params.set("type", filter);
  const query = params.toString();
  return `${buildProfilePath(locale, slug)}${query ? `?${query}` : ""}`;
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
  const typeParam = resolvedSearch?.type;
  const parsedType = Array.isArray(typeParam) ? typeParam[0] : typeParam;
  const activeFilter: FilterKey = parsedType === "image" || parsedType === "video" ? parsedType : "all";

  const profileResult = await getPublicProfileBySlug(slug, { page: currentPage, pageSize: 12 });

  if (!profileResult.success || !profileResult.data) {
    notFound();
  }

  const { user, jobs, hasMore } = profileResult.data;
  const filteredJobs = jobs.filter((job) => {
    if (activeFilter === "all") return true;
    return job.coverAsset.type === activeFilter;
  });

  return (
    <>
      <Header enableSidebarSheet />
      <main className="px-4 pb-20 pt-10 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 text-white">
          <ProfileHeader
            locale={locale}
            slug={user.slug}
            jobCount={profileResult.data.totalCount}
            displayName={user.displayName}
            avatarUrl={user.avatarUrl}
          />

          <section className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              {FILTERS.map((filter) => (
                <I18nLink
                  key={filter.key}
                  href={buildFilterLink(locale, user.slug, currentPage, filter.key)}
                  prefetch
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm transition",
                    activeFilter === filter.key
                      ? "border-white/25 bg-white/15 text-white"
                      : "border-white/10 bg-transparent text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {filter.label}
                </I18nLink>
              ))}
            </div>

            {filteredJobs.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid auto-rows-[12px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {filteredJobs.map((job) => (
                  <ProfileJobCard key={job.id} job={job} locale={locale} />
                ))}
              </div>
            )}

            {hasMore ? (
              <div className="flex justify-center pt-4">
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                >
                  <I18nLink
                    href={`${buildProfilePath(locale, user.slug)}?page=${currentPage + 1}${activeFilter !== "all" ? `&type=${activeFilter}` : ""}`}
                    prefetch
                  >
                    加载更多
                  </I18nLink>
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
