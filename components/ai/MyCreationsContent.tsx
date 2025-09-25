"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MyCreationsFilterTabs } from "@/components/ai/MyCreationsFilterTabs";
import type { MyCreationsFilterOption } from "@/components/ai/MyCreationsFilterTabs";
import { CreationItem, CreationOutput } from "@/lib/ai/creations";

const STATUS_TEXT_MAP: Record<string, string> = {
  pending: "生成中",
  queued: "生成中",
  processing: "生成中",
  completed: "已完成",
  failed: "生成失败",
  cancelled: "已取消",
  cancelled_insufficient_credits: "积分不足",
};

function getStatusLabel(status?: string | null) {
  if (!status) return "未知状态";
  return STATUS_TEXT_MAP[status] ?? status;
}

function isVideoOutput(output?: CreationOutput | null) {
  if (!output) return false;

  const mimeType = output.type?.toLowerCase() ?? "";
  if (mimeType.startsWith("video")) {
    return true;
  }

  const url = output.url?.toLowerCase() ?? "";
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}

type FilterKey = "all" | "video" | "image";

const FILTER_OPTIONS: ReadonlyArray<MyCreationsFilterOption> = [
  { value: "all", label: "全部" },
  { value: "video", label: "视频" },
  { value: "image", label: "图片" },
];

const FILTER_ENDPOINTS: Record<FilterKey, (page: number, pageSize: number) => string> = {
  all: (page, pageSize) => `/api/ai/my-creations?page=${page}&pageSize=${pageSize}`,
  video: (page, pageSize) => `/api/ai/my-creations/videos?page=${page}&pageSize=${pageSize}`,
  image: (page, pageSize) => `/api/ai/my-creations/images?page=${page}&pageSize=${pageSize}`,
};

const POLL_INTERVAL_MS = 5000;
const PROCESSING_STATUSES = new Set([
  "pending",
  "queued",
  "processing",
  "running",
  "in_progress",
]);

function buildEndpoint(filter: FilterKey, page: number, pageSize: number): string {
  const builder = FILTER_ENDPOINTS[filter] ?? FILTER_ENDPOINTS.all;
  return builder(page, pageSize);
}

function getEffectiveStatus(item: CreationItem) {
  const candidate = item.latestStatus ?? item.status;
  return typeof candidate === "string" ? candidate.toLowerCase() : null;
}

function isProcessingStatus(value?: string | null) {
  if (!value) {
    return false;
  }
  return PROCESSING_STATUSES.has(value.toLowerCase());
}

function isFilterKey(value: string): value is FilterKey {
  return FILTER_OPTIONS.some((option) => option.value === value);
}

type FilterState = {
  items: CreationItem[];
  totalCount: number;
  page: number;
  initialized: boolean;
};

type FilterStateMap = Record<FilterKey, FilterState>;

type ApiResponse = {
  success: boolean;
  data?: {
    items: CreationItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  error?: string;
};

type MyCreationsContentProps = {
  initialItems: CreationItem[];
  totalCount: number;
  pageSize: number;
  isAuthenticated: boolean;
};

export function MyCreationsContent({
  initialItems,
  totalCount,
  pageSize,
  isAuthenticated,
}: MyCreationsContentProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [filterStates, setFilterStates] = useState<FilterStateMap>({
    all: { items: initialItems, totalCount, page: 0, initialized: true },
    video: { items: [], totalCount: 0, page: 0, initialized: false },
    image: { items: [], totalCount: 0, page: 0, initialized: false },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFilterStates((prev) => ({
      ...prev,
      all: { items: initialItems, totalCount, page: 0, initialized: true },
    }));
  }, [initialItems, totalCount]);

  const currentState = filterStates[activeFilter] ?? {
    items: [],
    totalCount: 0,
    page: 0,
    initialized: false,
  };

  const items = currentState.items;
  const currentTotal = currentState.totalCount;
  const hasMore = items.length < currentTotal;
  const hasProcessingItems = useMemo(
    () => items.some((item) => isProcessingStatus(getEffectiveStatus(item))),
    [items]
  );

  const handleFilterChange = async (value: string) => {
    if (loading) {
      return;
    }

    const nextFilter: FilterKey = isFilterKey(value) ? value : "all";

    if (nextFilter === activeFilter) {
      return;
    }

    setActiveFilter(nextFilter);
    setError(null);

    const targetState = filterStates[nextFilter];
    if (targetState?.initialized) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(buildEndpoint(nextFilter, 0, pageSize), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? response.statusText);
      }

      const nextItems = result.data?.items ?? [];
      const nextTotalCount = result.data?.totalCount ?? 0;

      setFilterStates((prev) => ({
        ...prev,
        [nextFilter]: {
          items: nextItems,
          totalCount: nextTotalCount,
          page: 0,
          initialized: true,
        },
      }));
    } catch (err: any) {
      console.error("[my-creations] fetch filter failed", err);
      setError(err?.message ?? "加载失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loading || !hasMore) {
      return;
    }

    const filterForRequest = activeFilter;
    const nextPage = (filterStates[filterForRequest]?.page ?? 0) + 1;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildEndpoint(filterForRequest, nextPage, pageSize), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? response.statusText);
      }

      const nextItems = result.data?.items ?? [];
      const nextTotalCount = result.data?.totalCount ?? currentTotal;

      setFilterStates((prev) => {
        const state: FilterState = prev[filterForRequest] ?? {
          items: [],
          totalCount: 0,
          page: 0,
          initialized: true,
        };

        return {
          ...prev,
          [filterForRequest]: {
            items: [...state.items, ...nextItems],
            totalCount: nextTotalCount,
            page: nextPage,
            initialized: true,
          },
        };
      });
    } catch (err: any) {
      console.error("[my-creations] load more failed", err);
      setError(err?.message ?? "加载失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveFilter = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(buildEndpoint(activeFilter, 0, pageSize), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          signal,
        });

        const result = (await response.json()) as ApiResponse;

        if (!response.ok || !result.success) {
          throw new Error(result.error ?? response.statusText);
        }

        const nextItems = result.data?.items ?? [];
        const nextTotalCount = result.data?.totalCount;

        setFilterStates((prev) => {
          const prevState = prev[activeFilter] ?? {
            items: [],
            totalCount: 0,
            page: 0,
            initialized: true,
          };

          if (nextItems.length === 0) {
            return {
              ...prev,
              [activeFilter]: {
                ...prevState,
                items: [],
                totalCount: typeof nextTotalCount === "number" ? nextTotalCount : prevState.totalCount,
                page: 0,
              },
            };
          }

          const seen = new Set(nextItems.map((item) => item.jobId));
          const mergedItems = [
            ...nextItems,
            ...prevState.items.filter((item) => !seen.has(item.jobId)),
          ];

          return {
            ...prev,
            [activeFilter]: {
              ...prevState,
              items: mergedItems,
              totalCount: typeof nextTotalCount === "number" ? nextTotalCount : prevState.totalCount,
              page: prevState.page,
              initialized: true,
            },
          };
        });
      } catch (err: any) {
        if (err?.name === "AbortError") {
          return;
        }
        console.error("[my-creations] polling refresh failed", err);
      }
    },
    [activeFilter, pageSize]
  );

  useEffect(() => {
    if (!hasProcessingItems) {
      return;
    }

    let controller: AbortController | null = null;
    let isFetching = false;
    let cancelled = false;

    const tick = async () => {
      if (isFetching || cancelled) {
        return;
      }
      controller?.abort();
      controller = new AbortController();
      isFetching = true;
      try {
        await refreshActiveFilter(controller.signal);
      } finally {
        isFetching = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void tick();
    }, POLL_INTERVAL_MS);

    void tick();

    return () => {
      cancelled = true;
      controller?.abort();
      window.clearInterval(intervalId);
    };
  }, [hasProcessingItems, refreshActiveFilter]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-white">登录后即可查看你的创作</h3>
          <p className="text-sm text-white/70">请先登录账号，再返回此页面查看历史生成记录。</p>
          <Button asChild variant="secondary">
            <Link href="/login">立即登录</Link>
          </Button>
        </div>
      </div>
    );
  }

  const showSkeletonGrid = loading && items.length === 0;
  const showEmptyState = !loading && items.length === 0;

  return (
    <div className="w-full">
      <div className="mb-6">
        <MyCreationsFilterTabs options={FILTER_OPTIONS} value={activeFilter} onChange={handleFilterChange} />
        {error && items.length === 0 ? (
          <p className="mt-2 text-sm text-red-300">{error}</p>
        ) : null}
      </div>

      {showSkeletonGrid ? (
        <div className="flex justify-center py-10 text-sm text-white/70">加载中...</div>
      ) : showEmptyState ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="text-center space-y-3">
            <h3 className="text-xl font-semibold text-white">暂无作品</h3>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {items.map((item) => {
          const [primaryOutput] = item.outputs;
          const assetUrl = primaryOutput?.url ?? primaryOutput?.thumbUrl ?? undefined;
          const video = isVideoOutput(primaryOutput);
          const imageSrc = !video ? assetUrl : primaryOutput?.thumbUrl ?? null;
          const status = item.status ?? undefined;
          const statusLabel = getStatusLabel(status);
          const isInProgress = status === "queued" || status === "pending" || status === "processing";
          const isError = status === "failed" || status === "cancelled" || status === "cancelled_insufficient_credits";

          const fallbackContent = (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
              {isInProgress ? (
                <>
                  <span className="block h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white/80" />
                  <span className="mt-3 text-[13px] text-white/70">{statusLabel}</span>
                </>
              ) : (
                <span
                  className={cn(
                    "rounded-md px-3 py-1 text-sm",
                    isError ? "bg-rose-500/15 text-rose-100" : "bg-white/15 text-white/80"
                  )}
                >
                  {statusLabel}
                </span>
              )}
            </div>
          );

          const mediaContent = (() => {
            if (!primaryOutput) {
              return fallbackContent;
            }

            if (video) {
              const videoSrc = primaryOutput.url;
              const poster = primaryOutput.thumbUrl ?? undefined;

              if (!videoSrc && !poster) {
                return fallbackContent;
              }

              const element = videoSrc ? (
                <video
                  src={videoSrc}
                  poster={poster}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  playsInline
                  muted
                  loop
                  preload="metadata"
                />
              ) : poster ? (
                <Image
                  src={poster}
                  alt="生成结果"
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 18vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  priority={false}
                />
              ) : null;

              if (!element) {
                return fallbackContent;
              }

              return assetUrl ? (
                <a href={assetUrl} target="_blank" rel="noopener noreferrer">
                  {element}
                </a>
              ) : (
                element
              );
            }

            if (!imageSrc) {
              return fallbackContent;
            }

            const imageElement = (
              <Image
                src={imageSrc}
                alt="生成结果"
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 18vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                priority={false}
              />
            );

            return assetUrl ? (
              <a href={assetUrl} target="_blank" rel="noopener noreferrer">
                {imageElement}
              </a>
            ) : (
              imageElement
            );
          })();

            return (
              <div
                key={item.jobId}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <div className="relative aspect-square overflow-hidden">
                  {mediaContent}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-3">
          {error && !loading ? <p className="text-sm text-red-300">{error}</p> : null}
          {hasMore ? (
            <Button onClick={loadMore} disabled={loading} variant="outline" className="w-40 border-white/20 text-white">
              {loading ? "加载中..." : "加载更多"}
            </Button>
          ) : (
            <p className="text-sm text-white/50">没有更多内容啦</p>
          )}
        </div>
      )}

      {loading && hasMore && items.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[320px] rounded-2xl bg-white/10" />
          ))}
        </div>
      )}
    </div>
  );
}
