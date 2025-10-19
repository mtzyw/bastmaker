"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { MyCreationsCard } from "@/components/ai/MyCreationsCard";
import { MyCreationsFilterTabs } from "@/components/ai/MyCreationsFilterTabs";
import type { MyCreationsFilterOption } from "@/components/ai/MyCreationsFilterTabs";
import { getEffectiveStatus, isProcessingStatus } from "@/components/ai/my-creations-helpers";
import type { CreationItem } from "@/lib/ai/creations";

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

function buildEndpoint(filter: FilterKey, page: number, pageSize: number): string {
  const builder = FILTER_ENDPOINTS[filter] ?? FILTER_ENDPOINTS.all;
  return builder(page, pageSize);
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
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const locale = useLocale();
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

  const handleOpenViewer = useCallback(
    (item: CreationItem) => {
      if (!item.shareSlug) {
        return;
      }

      const localePrefix = locale ? `/${locale}` : "";
      router.push(`${localePrefix}/v/${item.shareSlug}`);
    },
    [locale, router]
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

  const loadMore = useCallback(async () => {
    if (loading) {
      return;
    }

    const filterForRequest = activeFilter;
    const state: FilterState = filterStates[filterForRequest] ?? {
      items: [],
      totalCount: 0,
      page: 0,
      initialized: false,
    };

    const hasMoreItems = state.items.length < state.totalCount;
    if (!hasMoreItems) {
      return;
    }

    const nextPage = (state.page ?? 0) + 1;

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
      const apiHasMore = result.data?.hasMore;
      const reportedTotalCount = typeof result.data?.totalCount === "number" ? result.data.totalCount : state.totalCount;

      setFilterStates((prev) => {
        const prevState: FilterState = prev[filterForRequest] ?? {
          items: [],
          totalCount: 0,
          page: 0,
          initialized: true,
        };

        const shouldAppend = nextItems.length > 0;
        const combinedItems = shouldAppend ? [...prevState.items, ...nextItems] : prevState.items;
        const finalTotalCount = apiHasMore === false ? combinedItems.length : reportedTotalCount;

        return {
          ...prev,
          [filterForRequest]: {
            items: combinedItems,
            totalCount: finalTotalCount,
            page: shouldAppend ? nextPage : prevState.page,
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
  }, [activeFilter, filterStates, loading, pageSize]);

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

  useEffect(() => {
    if (!hasMore) {
      return;
    }

    const node = loadMoreRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting) {
        void loadMore();
      }
    }, { rootMargin: "240px" });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore, items.length]);

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
        <div className="grid auto-rows-[12px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {items.map((item) => (
            <MyCreationsCard key={item.jobId} item={item} onOpen={handleOpenViewer} />
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-3">
          {error && !loading ? <p className="text-sm text-red-300">{error}</p> : null}
          {hasMore ? (
            <div ref={loadMoreRef} className="h-6 w-full" />
          ) : (
            <p className="text-sm text-white/50">没有更多内容啦</p>
          )}
        </div>
      )}

      {loading && hasMore && items.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm text-white/70">
          <span className="block h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <span>加载中...</span>
        </div>
      )}
    </div>
  );
}
