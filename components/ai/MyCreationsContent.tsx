"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import type { ViewerJob } from "@/actions/ai-jobs/public";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MyCreationsCard, type DownloadVariant } from "@/components/ai/MyCreationsCard";
import { MyCreationsFilterTabs } from "@/components/ai/MyCreationsFilterTabs";
import type { MyCreationsFilterOption } from "@/components/ai/MyCreationsFilterTabs";
import { getEffectiveStatus, isProcessingStatus } from "@/components/ai/my-creations-helpers";
import type { CreationItem, CreationOutput } from "@/lib/ai/creations";
import { ViewerBoard } from "@/components/viewer/ViewerBoard";
import { siteConfig } from "@/config/site";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { downloadBase64File, downloadViaProxy } from "@/lib/downloadFile";
import { useDownloadAccess } from "@/hooks/useDownloadAccess";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { toast } from "sonner";

type FilterKey = "all" | "video" | "image" | "sound";

const FILTER_KEYS: ReadonlyArray<FilterKey> = ["all", "video", "image", "sound"];

const FILTER_ENDPOINTS: Record<FilterKey, (page: number, pageSize: number) => string> = {
  all: (page, pageSize) => `/api/ai/my-creations?page=${page}&pageSize=${pageSize}`,
  video: (page, pageSize) => `/api/ai/my-creations/videos?page=${page}&pageSize=${pageSize}`,
  image: (page, pageSize) => `/api/ai/my-creations/images?page=${page}&pageSize=${pageSize}`,
  sound: (page, pageSize) => `/api/ai/my-creations/sounds?page=${page}&pageSize=${pageSize}`,
};

const POLL_INTERVAL_MS = 5000;

function buildEndpoint(filter: FilterKey, page: number, pageSize: number): string {
  const builder = FILTER_ENDPOINTS[filter] ?? FILTER_ENDPOINTS.all;
  return builder(page, pageSize);
}

function isFilterKey(value: string): value is FilterKey {
  return FILTER_KEYS.includes(value as FilterKey);
}

type FilterState = {
  items: CreationItem[];
  totalCount: number;
  page: number;
  initialized: boolean;
};

type FilterStateMap = Record<FilterKey, FilterState>;

type DownloadTargets = {
  watermarkUrl: string | null;
  originalUrl: string | null;
  fallbackExtension: string;
};

function inferFileExtension(url?: string | null, fallback: string = "png") {
  if (!url) {
    return fallback;
  }
  const clean = url.split(/[?#]/)[0] ?? "";
  const match = clean.match(/\.([a-zA-Z0-9]+)$/);
  if (!match) {
    return fallback;
  }
  const ext = match[1]?.toLowerCase();
  if (!ext || ext.length > 6) {
    return fallback;
  }
  return ext;
}

function sanitizeFileStem(raw?: string | null) {
  if (!raw) {
    return null;
  }
  const stem = raw
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase()
    .slice(0, 48)
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return stem.length > 0 ? stem : null;
}

function detectFallbackExtension(output?: CreationOutput | null, modalityCode?: string | null) {
  const type = output?.type?.toLowerCase() ?? "";
  if (type.startsWith("video")) {
    return "mp4";
  }
  if (type.startsWith("audio")) {
    return "mp3";
  }
  if (type.startsWith("image")) {
    return "png";
  }
  if (modalityCode?.includes("a")) {
    return "mp3";
  }
  if (modalityCode?.includes("v")) {
    return "mp4";
  }
  return "png";
}

function firstNonEmpty(candidates: Array<string | null | undefined>) {
  return candidates.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;
}

function resolveDownloadTargets(item: CreationItem): DownloadTargets {
  const outputs = Array.isArray(item.outputs) ? item.outputs : [];
  const selectPrimary = (predicate: (output: CreationOutput) => boolean) =>
    outputs.find((output) => {
      if (!output || typeof output !== "object") {
        return false;
      }
      return predicate(output);
    });

  const primaryImage = selectPrimary((output) => output.type?.toLowerCase().startsWith("image") ?? false);
  const primaryVideo = selectPrimary((output) => output.type?.toLowerCase().startsWith("video") ?? false);
  const primaryAudio = selectPrimary((output) => output.type?.toLowerCase().startsWith("audio") ?? false);

  const primary = primaryImage ?? primaryVideo ?? primaryAudio ?? (outputs.length > 0 ? outputs[0] : undefined);
  const metadata = (item.metadata ?? {}) as Record<string, unknown>;
  const fallbackUrl = typeof primary?.url === "string" && primary.url.length > 0 ? primary.url : null;

  const originalCandidates: Array<string | null> = [
    typeof primary?.url === "string" ? primary.url : null,
    typeof metadata.output_url === "string" ? (metadata.output_url as string) : null,
    typeof metadata.outputUrl === "string" ? (metadata.outputUrl as string) : null,
    typeof metadata.download_url === "string" ? (metadata.download_url as string) : null,
    typeof metadata.downloadUrl === "string" ? (metadata.downloadUrl as string) : null,
    typeof metadata.asset_url === "string" ? (metadata.asset_url as string) : null,
    typeof metadata.assetUrl === "string" ? (metadata.assetUrl as string) : null,
    typeof metadata.original_url === "string" ? (metadata.original_url as string) : null,
    typeof metadata.originalUrl === "string" ? (metadata.originalUrl as string) : null,
    typeof metadata.result_url === "string" ? (metadata.result_url as string) : null,
    typeof metadata.resultUrl === "string" ? (metadata.resultUrl as string) : null,
  ];

  const watermarkCandidates: Array<string | null> = [
    typeof primary?.thumbUrl === "string" ? primary.thumbUrl : null,
    typeof metadata.watermarked_url === "string" ? (metadata.watermarked_url as string) : null,
    typeof metadata.watermarkedUrl === "string" ? (metadata.watermarkedUrl as string) : null,
    typeof metadata.watermark_url === "string" ? (metadata.watermark_url as string) : null,
    typeof metadata.watermarkUrl === "string" ? (metadata.watermarkUrl as string) : null,
    typeof metadata.preview_url === "string" ? (metadata.preview_url as string) : null,
    typeof metadata.previewUrl === "string" ? (metadata.previewUrl as string) : null,
    typeof metadata.thumb_url === "string" ? (metadata.thumb_url as string) : null,
    typeof metadata.thumbUrl === "string" ? (metadata.thumbUrl as string) : null,
  ];

  return {
    originalUrl: firstNonEmpty(originalCandidates) ?? fallbackUrl,
    watermarkUrl: firstNonEmpty(watermarkCandidates) ?? fallbackUrl,
    fallbackExtension: detectFallbackExtension(primary, item.modalityCode),
  };
}

function buildDownloadFileName(item: CreationItem, variant: DownloadVariant, extension: string) {
  const metadataPrompt =
    typeof item.metadata?.prompt === "string" && item.metadata.prompt.length > 0
      ? (item.metadata.prompt as string)
      : null;
  const paramsPrompt =
    typeof item.inputParams?.prompt === "string" && item.inputParams.prompt.length > 0
      ? (item.inputParams.prompt as string)
      : null;
  const stem =
    sanitizeFileStem(metadataPrompt ?? paramsPrompt ?? item.publicTitle ?? item.modelSlug) ??
    `bestmaker-${item.jobId.slice(0, 6)}`;
  const suffix = variant === "watermark" ? "-wm" : "-clean";
  return `${stem}${suffix}.${extension}`;
}

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
  const locale = useLocale();
  const historyT = useTranslations("CreationHistory");
  const deleteConfirmTitle = historyT("messages.deleteConfirmTitle");
  const deleteConfirmDescription = historyT("messages.deleteConfirmDescription");
  const deleteCancelLabel = historyT("messages.deleteCancel");
  const deleteConfirmLabel = historyT("messages.deleteConfirm");
  const deletingLabel = historyT("messages.deleting");
  const localePrefix = useMemo(() => (locale === DEFAULT_LOCALE ? "" : `/${locale}`), [locale]);
  const filterOptions: ReadonlyArray<MyCreationsFilterOption> = useMemo(() => {
    const translationKeys: Record<FilterKey, "all" | "video" | "image" | "audio"> = {
      all: "all",
      video: "video",
      image: "image",
      sound: "audio",
    };
    return FILTER_KEYS.map((key) => ({
      value: key,
      label: historyT(`categories.${translationKeys[key]}`),
    }));
  }, [historyT]);
  const [previewItem, setPreviewItem] = useState<CreationItem | null>(null);
  const [viewerJob, setViewerJob] = useState<ViewerJob | null>(null);
  const [isViewerLoading, setIsViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const viewerFetchRef = useRef<AbortController | null>(null);
  const [showInitialOverlay, setShowInitialOverlay] = useState(initialItems.length > 0);
  const initialMeasurementsRemainingRef = useRef(initialItems.length);
  const initialOverlayActiveRef = useRef(initialItems.length > 0);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [filterStates, setFilterStates] = useState<FilterStateMap>({
    all: { items: initialItems, totalCount, page: 0, initialized: true },
    video: { items: [], totalCount: 0, page: 0, initialized: false },
    image: { items: [], totalCount: 0, page: 0, initialized: false },
    sound: { items: [], totalCount: 0, page: 0, initialized: false },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CreationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { benefits, isLoading: benefitsLoading } = useUserBenefits();
  const { ensureDownloadAllowed } = useDownloadAccess({
    benefits,
    isLoading: benefitsLoading,
  });

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

  const handleCardMeasured = useCallback(() => {
    if (!initialOverlayActiveRef.current) {
      return;
    }

    const next = initialMeasurementsRemainingRef.current <= 1 ? 0 : initialMeasurementsRemainingRef.current - 1;
    initialMeasurementsRemainingRef.current = next;

    if (next === 0) {
      initialOverlayActiveRef.current = false;
      setShowInitialOverlay(false);
    }
  }, []);

  const resetViewerState = useCallback(() => {
    if (viewerFetchRef.current) {
      viewerFetchRef.current.abort();
      viewerFetchRef.current = null;
    }
    setPreviewItem(null);
    setViewerJob(null);
    setViewerError(null);
    setIsViewerLoading(false);
  }, []);

  const handleOpenViewer = useCallback(
    (item: CreationItem) => {
      if (!item.shareSlug) {
        return;
      }

      const slug = item.shareSlug;

      if (viewerFetchRef.current) {
        viewerFetchRef.current.abort();
        viewerFetchRef.current = null;
      }

      setPreviewItem(item);
      setViewerJob(null);
      setViewerError(null);
      setIsViewerLoading(true);

      if (typeof window !== "undefined") {
        const nextUrl = `${localePrefix}/v/${slug}`;
        window.history.pushState({ modal: slug }, "", nextUrl);
      }

      const controller = new AbortController();
      viewerFetchRef.current = controller;

      fetch(`/api/viewer/${slug}`, { signal: controller.signal })
        .then(async (response) => {
          const json = await response.json().catch(() => ({}));
          if (!response.ok || !json?.success || !json?.data) {
            const message = json?.error ?? response.statusText ?? historyT("messages.loadFailed");
            throw new Error(message);
          }
          return json.data as ViewerJob;
        })
        .then((job) => {
          if (controller.signal.aborted) {
            return;
          }
          setViewerJob(job);
          setViewerError(null);
        })
        .catch((error: any) => {
          if (controller.signal.aborted) {
            return;
          }
          const message = error instanceof Error ? error.message : historyT("messages.loadFailed");
          setViewerError(message);
        })
        .finally(() => {
          if (viewerFetchRef.current === controller) {
            viewerFetchRef.current = null;
          }
          if (!controller.signal.aborted) {
            setIsViewerLoading(false);
          }
        });
    },
    [historyT, localePrefix]
  );

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open && previewItem) {
        if (typeof window !== "undefined") {
          window.history.back();
        } else {
          resetViewerState();
        }
      }
    },
    [previewItem, resetViewerState]
  );

  const handleDownload = useCallback(
    async (item: CreationItem, targets: DownloadTargets, variant: DownloadVariant) => {
      if (!ensureDownloadAllowed()) {
        return;
      }
      const targetUrl = variant === "watermark" ? targets.watermarkUrl : targets.originalUrl;
      if (!targetUrl) {
        toast.error(
          variant === "watermark"
            ? historyT("messages.downloadUnavailableWatermark")
            : historyT("messages.downloadUnavailableClean")
        );
        return;
      }
      const extension = inferFileExtension(targetUrl, targets.fallbackExtension);
      const fileName = buildDownloadFileName(item, variant, extension);

      if (targetUrl.startsWith("data:")) {
        downloadBase64File(targetUrl, fileName);
        return;
      }

      const ok = await downloadViaProxy(targetUrl, fileName, {
        jobId: item.jobId,
        variant,
      });
      if (!ok) {
        toast.error(historyT("messages.downloadFailed"));
      }
    },
    [ensureDownloadAllowed, historyT]
  );

  const handleCopyLink = useCallback(
    async (item: CreationItem) => {
      if (!item.shareSlug) {
        toast.error(historyT("messages.shareUnavailable"));
        return;
      }
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : siteConfig.url.replace(/\/$/, "");
      const shareUrl = `${origin}${localePrefix}/v/${item.shareSlug}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(historyT("messages.linkCopied"));
      } catch {
        const fallback = window.prompt(historyT("messages.copyPrompt"), shareUrl);
        if (fallback) {
          toast.success(historyT("messages.linkCopied"));
        } else {
          toast.error(historyT("messages.linkCopyFailed"));
        }
      }
    },
    [historyT, localePrefix]
  );

  const handleRequestDelete = useCallback((item: CreationItem) => {
    setDeleteTarget(item);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/ai/my-creations/${deleteTarget.jobId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result?.error ?? response.statusText ?? historyT("messages.deleteFailed"));
      }

      setFilterStates((prev) => {
        const nextEntries = { ...prev } as FilterStateMap;
        FILTER_KEYS.forEach((key) => {
          const state = prev[key];
          const exists = state.items.some((entry) => entry.jobId === deleteTarget.jobId);
          if (!exists) {
            return;
          }
          const updatedItems = state.items.filter((entry) => entry.jobId !== deleteTarget.jobId);
          nextEntries[key] = {
            ...state,
            items: updatedItems,
            totalCount: Math.max(0, state.totalCount - 1),
          };
        });
        return nextEntries;
      });

      if (previewItem?.jobId === deleteTarget.jobId) {
        resetViewerState();
      }

      toast.success(historyT("messages.deleteSuccess"));
      setDeleteTarget(null);
    } catch (error: any) {
      console.error("[my-creations] delete failed", error);
      toast.error(error?.message ?? historyT("messages.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, historyT, previewItem?.jobId, resetViewerState]);

  const viewerShareSlug = viewerJob?.shareSlug ?? previewItem?.shareSlug ?? null;
  const viewerShareUrl = useMemo(() => {
    if (!viewerShareSlug) {
      return null;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : siteConfig.url;
    return `${origin}${localePrefix}/v/${viewerShareSlug}?source=share`;
  }, [localePrefix, viewerShareSlug]);

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
        throw new Error(result.error ?? response.statusText ?? historyT("messages.loadFailed"));
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
      setError(err?.message ?? historyT("messages.loadFailed"));
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
        throw new Error(result.error ?? response.statusText ?? historyT("messages.loadFailed"));
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
      setError(err?.message ?? historyT("messages.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [activeFilter, filterStates, historyT, loading, pageSize]);

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
    if (!previewItem || typeof window === "undefined") {
      return;
    }

    const handlePopState = () => {
      resetViewerState();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [previewItem, resetViewerState]);

  useEffect(() => {
    return () => {
      viewerFetchRef.current?.abort();
    };
  }, []);

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
          <h3 className="text-xl font-semibold text-white">{historyT("login.title")}</h3>
          <p className="text-sm text-white/70">{historyT("login.description")}</p>
          <Button asChild variant="secondary">
            <Link href="/login">{historyT("login.cta")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const showSkeletonGrid = loading && items.length === 0;
  const showEmptyState = !loading && items.length === 0;
  const shouldShowInitialOverlay = showInitialOverlay && !showSkeletonGrid && !showEmptyState;

  return (
    <div className="w-full">
      <div className="mb-6">
        <MyCreationsFilterTabs options={filterOptions} value={activeFilter} onChange={handleFilterChange} />
        {error && items.length === 0 ? (
          <p className="mt-2 text-sm text-red-300">{error}</p>
        ) : null}
      </div>

      {showSkeletonGrid ? (
        <div className="flex justify-center py-10 text-sm text-white/70">{historyT("messages.loading")}</div>
      ) : showEmptyState ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="text-center space-y-3">
            <h3 className="text-xl font-semibold text-white">{historyT("emptyState.title")}</h3>
            <p className="text-sm text-white/70">{historyT("emptyState.description")}</p>
          </div>
        </div>
      ) : (
        <div className="relative min-h-[320px]">
          <div
            className={`grid auto-rows-[12px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 ${shouldShowInitialOverlay ? "invisible" : ""}`}
          >
            {items.map((item) => {
              const downloadTargets = resolveDownloadTargets(item);
              return (
                <MyCreationsCard
                  key={item.jobId}
                  item={item}
                  onOpen={handleOpenViewer}
                  onMeasured={handleCardMeasured}
                  onDownload={(variant) => handleDownload(item, downloadTargets, variant)}
                  onCopyLink={() => handleCopyLink(item)}
                  onDelete={() => handleRequestDelete(item)}
                  downloadAvailability={{
                    watermark: Boolean(downloadTargets.watermarkUrl),
                    clean: Boolean(downloadTargets.originalUrl),
                  }}
                  canCopyLink={Boolean(item.shareSlug)}
                />
              );
            })}
          </div>

          {shouldShowInitialOverlay ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-sm text-white/70">
                <span className="block h-10 w-10 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                <span>{historyT("messages.loading")}</span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-3">
          {error && !loading ? <p className="text-sm text-red-300">{error}</p> : null}
          {hasMore ? (
            <div ref={loadMoreRef} className="h-6 w-full" />
          ) : (
            <p className="text-sm text-white/50">{historyT("messages.noMore")}</p>
          )}
        </div>
      )}

      {loading && hasMore && items.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm text-white/70">
          <span className="block h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <span>{historyT("messages.loading")}</span>
        </div>
      )}

      <Dialog open={Boolean(previewItem)} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-[calc(100vw-2rem)] border border-white/10 bg-[#1c1c1a] text-white sm:max-w-[68rem]">
          {isViewerLoading ? (
            <div className="flex h-[60vh] w-full items-center justify-center text-white/60">
              {historyT("messages.loading")}
            </div>
          ) : viewerError ? (
            <div className="flex h-[60vh] w-full items-center justify-center text-white/60">
              {viewerError}
            </div>
          ) : viewerJob ? (
            <ViewerBoard
              job={viewerJob}
              shareUrl={viewerShareUrl ?? `${siteConfig.url}${localePrefix}/v/${viewerJob.shareSlug ?? viewerJob.id}`}
            />
          ) : (
            <div className="flex h-[40vh] w-full items-center justify-center text-white/60">
              {historyT("viewer.empty")}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent className="border border-white/10 bg-[#1c1c1a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {deleteConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              {deleteCancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
              className="bg-[#dc2e5a] text-white hover:bg-[#f0446e]"
            >
              {isDeleting ? deletingLabel : deleteConfirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
