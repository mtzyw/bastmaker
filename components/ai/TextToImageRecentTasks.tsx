"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dayjs from "dayjs";
import Image from "next/image";

import { getUserCreationsHistory } from "@/actions/creations";
import { CreationItem, CreationOutput } from "@/lib/ai/creations";
import { getTextToImageModelConfig } from "@/lib/ai/text-to-image-config";
import { getVideoModelConfig } from "@/lib/ai/video-config";
import { getSoundEffectModelConfig } from "@/lib/ai/sound-effect-config";
import AudioPlayer from "@components/audio-player";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowUp, Check, Copy, Download, Heart, MoreHorizontal, PenSquare, RefreshCcw, Share2, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { DEFAULT_LOCALE, useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";
import { useCreationHistoryStore } from "@/stores/creationHistoryStore";
import { buildRegenerationPlan, buildRepromptDraft, type RegenerationPlan } from "@/lib/ai/creation-retry";
import { useRepromptStore } from "@/stores/repromptStore";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ViewerJob } from "@/actions/ai-jobs/public";
import { ViewerBoard } from "@/components/viewer/ViewerBoard";
import { siteConfig } from "@/config/site";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CATEGORY_OPTIONS = [
  { key: "全部" as const, label: "全部" },
  { key: "视频" as const, label: "视频" },
  { key: "图片" as const, label: "图片" },
  { key: "音效" as const, label: "音效" },
];

type CategoryFilter = (typeof CATEGORY_OPTIONS)[number]["key"];

const DEFAULT_CATEGORY_ORDER: readonly CategoryFilter[] = ["全部", "视频", "图片", "音效"];

type TaskStatus = "failed" | "succeeded" | "processing";

type TaskMedia =
  | { kind: "image"; url?: string | null; thumbUrl?: string | null; durationSeconds?: number | null }
  | { kind: "video"; url?: string | null; thumbUrl?: string | null; durationSeconds?: number | null }
  | { kind: "audio"; url?: string | null; durationSeconds?: number | null }
  | { kind: "unknown"; url?: string | null; thumbUrl?: string | null; durationSeconds?: number | null };

type DisplayTask = {
  id: string;
  provider: string;
  modalityCode: string | null;
  typeLabel: string;
  modelLabel: string;
  createdAtLabel: string;
  prompt: string;
  negativePrompt?: string;
  status: TaskStatus;
  errorMessage?: string;
  media?: TaskMedia;
  aspectRatio?: string;
  seed?: number;
  favorite?: boolean;
  shareSlug: string | null;
  shareVisits: number;
  shareConversions: number;
  effectSlug?: string | null;
  effectTitle?: string | null;
};

const CATEGORY_MODALITY_MAP: Record<CategoryFilter, readonly string[] | undefined> = {
  全部: undefined,
  视频: ["t2v", "i2v"],
  图片: ["t2i", "i2i"],
  音效: ["t2a"],
};

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  freepik: "Bestmaker.ai",
};

const MODALITY_LABELS: Record<string, string> = {
  t2i: "Text to Image",
  i2i: "Image to Image",
  t2v: "Text to Video",
  i2v: "Image to Video",
  t2a: "Text to Sound",
};

const PAGE_SIZE = 10;
const POLL_INTERVAL_MS = 5000;

type AiJobRow = Database["public"]["Tables"]["ai_jobs"]["Row"];
type AiJobOutputRow = Database["public"]["Tables"]["ai_job_outputs"]["Row"];

type TextToImageRecentTasksProps = {
  initialCategory?: CategoryFilter;
  categories?: readonly CategoryFilter[];
  hideEffectBadge?: boolean;
};

type TrackedGenerationStatus = "processing" | "completed";

function formatProviderName(code?: string | null) {
  if (!code) {
    return "Unknown";
  }
  return PROVIDER_DISPLAY_NAMES[code] ?? code.replace(/^[a-z]/, (c) => c.toUpperCase());
}

function matchesCategory(item: CreationItem, category: CategoryFilter) {
  if (category === "全部") {
    return true;
  }
  const allowed = CATEGORY_MODALITY_MAP[category];
  if (!allowed || allowed.length === 0) {
    return true;
  }
  const modality = getModality(item);
  if (!modality) {
    return category === "图片";
  }
  return allowed.includes(modality);
}

function mapStatus(status?: string | null): TaskStatus {
  const normalized = status?.toLowerCase();
  if (!normalized) {
    return "processing";
  }
  if (["completed", "success", "succeeded", "done"].includes(normalized)) {
    return "succeeded";
  }
  if ([
    "failed",
    "error",
    "cancelled",
    "canceled",
    "cancelled_insufficient_credits",
    "refunded",
  ].includes(normalized)) {
    return "failed";
  }
  return "processing";
}

function getModality(job: CreationItem) {
  const fromField = job.modalityCode;
  if (typeof fromField === "string" && fromField.length > 0) {
    return fromField;
  }
  const fromMetadata = job.metadata?.modality_code;
  return typeof fromMetadata === "string" ? fromMetadata : null;
}

function getTypeLabel(job: CreationItem) {
  const modality = getModality(job);
  if (!modality) {
    return "AI Generation";
  }
  return MODALITY_LABELS[modality] ?? "AI Generation";
}

function getModelLabel(job: CreationItem) {
  const modality = getModality(job);
  const slugFromJob = typeof job.modelSlug === "string" && job.modelSlug.length > 0 ? job.modelSlug : null;
  const slugFromParams = typeof job.inputParams?.model === "string" ? job.inputParams.model : null;
  const slug = slugFromJob ?? slugFromParams;
  if (!slug) {
    const metadataName = job.metadata?.model_display_name;
    if (typeof metadataName === "string" && metadataName.length > 0) {
      return metadataName;
    }
    return "Unknown Model";
  }

  if (modality === "t2v" || modality === "i2v") {
    return getVideoModelConfig(slug).displayName;
  }
  if (modality === "t2a") {
    return getSoundEffectModelConfig(slug).displayName;
  }
  return getTextToImageModelConfig(slug).displayName;
}

function getPrimaryMedia(job: CreationItem): TaskMedia | undefined {
  const outputs = Array.isArray(job.outputs) ? job.outputs : [];
  if (!outputs.length) {
    return undefined;
  }

  const imageOutput = outputs.find((output) =>
    (output.type ?? "").toLowerCase().startsWith("image")
  );
  if (imageOutput && (imageOutput.url || imageOutput.thumbUrl)) {
    return {
      kind: "image",
      url: imageOutput.url,
      thumbUrl: imageOutput.thumbUrl,
      durationSeconds: imageOutput.duration ?? null,
    };
  }

  const videoOutput = outputs.find((output) =>
    (output.type ?? "").toLowerCase().startsWith("video")
  );
  if (videoOutput && (videoOutput.url || videoOutput.thumbUrl)) {
    return {
      kind: "video",
      url: videoOutput.url,
      thumbUrl: videoOutput.thumbUrl,
      durationSeconds: videoOutput.duration ?? null,
    };
  }

  const audioOutput = outputs.find((output) =>
    (output.type ?? "").toLowerCase().startsWith("audio")
  );
  if (audioOutput && audioOutput.url) {
    const durationValue = Number.isFinite(audioOutput.duration ?? NaN)
      ? Number(audioOutput.duration)
      : Number.isFinite(job.metadata?.duration_seconds ?? NaN)
        ? Number(job.metadata?.duration_seconds)
        : Number.isFinite(job.inputParams?.duration_seconds ?? NaN)
          ? Number(job.inputParams?.duration_seconds)
          : null;
    return {
      kind: "audio",
      url: audioOutput.url,
      durationSeconds: durationValue,
    };
  }

  const fallback = outputs[0];
  if (fallback.url || fallback.thumbUrl) {
    return {
      kind: "unknown",
      url: fallback.url,
      thumbUrl: fallback.thumbUrl,
      durationSeconds: fallback.duration ?? null,
    };
  }

  return undefined;
}

function parseAspectRatio(job: CreationItem) {
  const fromParams = job.inputParams?.aspect_ratio;
  if (typeof fromParams === "string" && fromParams.length > 0) {
    return fromParams;
  }
  const fromMetadata = job.metadata?.aspect_ratio;
  if (typeof fromMetadata === "string" && fromMetadata.length > 0) {
    return fromMetadata;
  }
  return undefined;
}

function parseSeed(job: CreationItem) {
  const seedValue = job.seed ?? job.metadata?.seed;
  if (seedValue === null || seedValue === undefined) {
    return undefined;
  }
  const numeric = Number(seedValue);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function parsePrompt(value: unknown) {
  return typeof value === "string" ? value : "";
}

function mapJobRowToCreationItem(row: AiJobRow): CreationItem {
  const metadata = (row.metadata_json ?? {}) as Record<string, any>;
  const inputParams = (row.input_params_json ?? {}) as Record<string, any>;
  const latestStatus =
    typeof metadata.freepik_latest_status === "string"
      ? metadata.freepik_latest_status
      : null;
  const isImageToImage =
    typeof metadata.is_image_to_image === "boolean"
      ? metadata.is_image_to_image
      : false;
  const referenceImageCount =
    typeof metadata.reference_image_count === "number"
      ? metadata.reference_image_count
      : 0;

  return {
    jobId: row.id,
    providerCode: row.provider_code,
    providerJobId: row.provider_job_id,
    status: row.status ?? null,
    latestStatus,
    createdAt: row.created_at ?? new Date().toISOString(),
    costCredits:
      typeof row.cost_actual_credits === "number"
        ? row.cost_actual_credits
        : typeof row.cost_estimated_credits === "number"
        ? row.cost_estimated_credits
        : 0,
    outputs: [],
    metadata,
    inputParams,
    modalityCode:
      row.modality_code ?? (typeof metadata.modality_code === "string" ? metadata.modality_code : null),
    modelSlug: row.model_slug_at_submit,
    errorMessage: row.error_message,
    seed: row.seed,
    isImageToImage,
    referenceImageCount,
  };
}

function mapOutputRowToCreationOutput(row: AiJobOutputRow): CreationOutput {
  return {
    id: row.id,
    url: row.url,
    thumbUrl: row.thumb_url,
    type: row.type,
    createdAt: row.created_at,
  };
}

function toDisplayTask(job: CreationItem): DisplayTask {
  const effectiveStatus = job.latestStatus ?? job.status;
  const effectSlug =
    typeof job.metadata?.effect_slug === "string" ? job.metadata.effect_slug : null;
  const effectTitle =
    typeof job.metadata?.effect_title === "string" ? job.metadata.effect_title : null;
  return {
    id: job.jobId,
    provider: formatProviderName(job.providerCode),
    modalityCode: getModality(job),
    typeLabel: getTypeLabel(job),
    modelLabel: getModelLabel(job),
    createdAtLabel: dayjs(job.createdAt).format("MM-DD HH:mm"),
    prompt: parsePrompt(job.inputParams?.prompt ?? job.inputParams?.text ?? job.metadata?.prompt),
    negativePrompt: parsePrompt(job.inputParams?.negative_prompt) || undefined,
    status: mapStatus(effectiveStatus),
    errorMessage:
      (typeof job.errorMessage === "string" && job.errorMessage.length > 0
        ? job.errorMessage
        : undefined) ??
      (typeof job.metadata?.error_message === "string"
        ? job.metadata.error_message
        : undefined),
    media: getPrimaryMedia(job),
    aspectRatio: parseAspectRatio(job),
    seed: parseSeed(job),
    favorite: Boolean(job.metadata?.is_favorite),
    shareSlug: job.shareSlug,
    shareVisits: job.shareVisitCount,
    shareConversions: job.shareConversionCount,
    effectSlug,
    effectTitle,
  };
}

export default function TextToImageRecentTasks({
  initialCategory = "全部",
  categories = DEFAULT_CATEGORY_ORDER,
  hideEffectBadge = false,
}: TextToImageRecentTasksProps = {}) {
  const normalizedCategories = useMemo(() => {
    const unique = Array.from(new Set(categories));
    return unique.length > 0 ? (unique as CategoryFilter[]) : [...DEFAULT_CATEGORY_ORDER];
  }, [categories]);
  const resolvedInitialCategory = useMemo(() => {
    return normalizedCategories.includes(initialCategory)
      ? initialCategory
      : normalizedCategories[0] ?? "全部";
  }, [initialCategory, normalizedCategories]);
  const locale = useLocale();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(resolvedInitialCategory);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [previewTask, setPreviewTask] = useState<DisplayTask | null>(null);
  const [viewerJob, setViewerJob] = useState<ViewerJob | null>(null);
  const [isViewerLoading, setIsViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollViewportEl, setScrollViewportEl] = useState<HTMLDivElement | null>(null);
  const [trackedGeneration, setTrackedGeneration] = useState<Record<string, TrackedGenerationStatus>>({});
  const [taskToDelete, setTaskToDelete] = useState<DisplayTask | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const viewerFetchRef = useRef<AbortController | null>(null);
  const prefetchedJobsRef = useRef<Map<string, ViewerJob>>(new Map());
  const prefetchingSlugsRef = useRef<Set<string>>(new Set());
  const prefetchAbortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const hasCapturedInitialSlugsRef = useRef(false);
  const previousSucceededSlugsRef = useRef<Set<string>>(new Set());

  const items = useCreationHistoryStore((state) => state.items);
  const mergeItems = useCreationHistoryStore((state) => state.mergeItems);
  const upsertItem = useCreationHistoryStore((state) => state.upsertItem);
  const appendOutput = useCreationHistoryStore((state) => state.appendOutput);
  const removeItem = useCreationHistoryStore((state) => state.removeItem);
  const clearStore = useCreationHistoryStore((state) => state.clear);
  const setRepromptDraft = useRepromptStore((state) => state.setDraft);
  const itemMap = useMemo(() => new Map(items.map((entry) => [entry.jobId, entry])), [items]);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());

  const fetchInFlightRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const handleViewportRef = useCallback((node: HTMLDivElement | null) => {
    setScrollViewportEl(node);
  }, []);
  const isRegenerating = useCallback(
    (jobId: string) => regeneratingIds.has(jobId),
    [regeneratingIds]
  );

  const handleReprompt = useCallback(
    (jobId: string) => {
      const original = itemMap.get(jobId);
      if (!original) {
        toast.error("未找到任务详情，无法重新编辑提示词");
        return;
      }
      if (original.metadata?.effect_slug) {
        toast.error("特效任务暂不支持重新编辑提示词");
        return;
      }
      try {
        const draft = buildRepromptDraft(original);
        setRepromptDraft(draft);
        const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
        router.push(`${localePrefix}${draft.route}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "无法重新编辑该任务";
        toast.error(message);
      }
    },
    [itemMap, locale, router, setRepromptDraft]
  );

  const handleRegenerate = useCallback(
    async (jobId: string) => {
      if (isRegenerating(jobId)) {
        return;
      }

      const original = itemMap.get(jobId);
      if (!original) {
        toast.error("未找到任务详情，无法重新生成");
        return;
      }

      const normalizedStatus = mapStatus(original.latestStatus ?? original.status);
      if (normalizedStatus !== "succeeded") {
        toast.info("任务仍在生成中，请稍后重试");
        return;
      }

      let plan: RegenerationPlan;
      try {
        plan = buildRegenerationPlan(original);
      } catch (error) {
        const message = error instanceof Error ? error.message : "无法重新生成该任务";
        toast.error(message);
        return;
      }

      const optimistic = plan.optimisticItem;
      upsertItem(optimistic);

      setRegeneratingIds((prev) => {
        const next = new Set(prev);
        next.add(jobId);
        return next;
      });

      try {
        const response = await fetch(plan.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plan.payload),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result?.success) {
          const message = result?.error ?? response.statusText ?? "重新生成失败";
          throw new Error(message);
        }

        const payload = (result?.data ?? {}) as {
          jobId?: string;
          providerJobId?: string;
          status?: string;
          freepikStatus?: string;
          creditsCost?: number;
        };

        if (payload?.jobId) {
          const persistedItem = plan.buildPersistedItem(payload);
          upsertItem(persistedItem);
          removeItem(optimistic.jobId);
        } else {
          toast.info("已提交重新生成任务，请稍候在历史记录查看进度");
        }

      } catch (error) {
        removeItem(optimistic.jobId);
        const message = error instanceof Error ? error.message : "重新生成失败，请稍后重试";
        toast.error(message);
      } finally {
        setRegeneratingIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      }
    },
    [itemMap, isRegenerating, upsertItem, removeItem]
  );

  const loadHistory = useCallback(
    async ({
      page = 0,
      withSpinner = false,
      signal,
    }: {
      page?: number;
      withSpinner?: boolean;
      signal?: AbortSignal;
    } = {}) => {
      if (signal?.aborted) {
        return;
      }

      const appending = page > 0;

      if (appending && fetchInFlightRef.current) {
        return;
      }

      fetchInFlightRef.current = true;

      if (withSpinner) {
        setIsLoading(true);
        setError(null);
        setIsUnauthorized(false);
      }

      if (appending) {
        setIsLoadingMore(true);
      }

      try {
        const modalityCodes = CATEGORY_MODALITY_MAP[activeCategory];
        const result = await getUserCreationsHistory({
          pageIndex: page,
          pageSize: PAGE_SIZE,
          modalityCodes: modalityCodes ? [...modalityCodes] : undefined,
        });

        if (signal?.aborted) {
          return;
        }

        if (!result.success) {
          const message = result.error ?? "Failed to load history";
          if (/unauthorized|authentication/i.test(message)) {
            setIsUnauthorized(true);
            clearStore();
          } else if (!appending) {
            setError(message);
          }
          setHasMore(false);
          return;
        }

        mergeItems(result.data?.items ?? []);
        setError(null);
        setIsUnauthorized(false);
        setHasMore(Boolean(result.data?.hasMore));
        setPageIndex(page);
      } catch (err: any) {
        if (signal?.aborted) {
          return;
        }
        console.error("[TextToImageRecentTasks] load failed", err);
        if (!appending) {
          setError(err?.message ?? "加载失败，请稍后再试");
        }
      } finally {
        if (!signal?.aborted && withSpinner) {
          setIsLoading(false);
        }
        if (appending) {
          setIsLoadingMore(false);
        }
        fetchInFlightRef.current = false;
      }
    },
    [activeCategory, clearStore, mergeItems, setError, setIsLoading, setIsUnauthorized]
  );

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading || fetchInFlightRef.current) {
      return;
    }
    await loadHistory({ page: pageIndex + 1 });
  }, [hasMore, isLoadingMore, isLoading, loadHistory, pageIndex]);

  useEffect(() => {
    const controller = new AbortController();
    setPageIndex(0);
    setHasMore(true);
    void loadHistory({ page: 0, withSpinner: true, signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [loadHistory]);

  useEffect(() => {
    if (!normalizedCategories.includes(activeCategory)) {
      setActiveCategory(resolvedInitialCategory);
    }
  }, [activeCategory, normalizedCategories, resolvedInitialCategory]);

  useEffect(() => {
    setActiveCategory(resolvedInitialCategory);
  }, [resolvedInitialCategory]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let jobChannel: RealtimeChannel | null = null;
    let outputChannel: RealtimeChannel | null = null;

    const setup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        return;
      }

      jobChannel = supabase
        .channel(`ai-jobs-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "ai_jobs",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (cancelled) {
              return;
            }
            if (payload.eventType === "DELETE") {
              const oldRow = payload.old as AiJobRow | null;
              if (oldRow?.id) {
                removeItem(oldRow.id);
              }
              return;
            }
            const row = payload.new as AiJobRow | null;
            if (!row) {
              return;
            }
            mergeItems([mapJobRowToCreationItem(row)]);
          }
        )
        .subscribe();

      outputChannel = supabase
        .channel(`ai-job-outputs-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ai_job_outputs",
          },
          (payload) => {
            if (cancelled) {
              return;
            }
            const row = payload.new as AiJobOutputRow | null;
            if (!row) {
              return;
            }
            appendOutput(row.job_id, mapOutputRowToCreationOutput(row));
          }
        )
        .subscribe();
    };

    void setup();

    return () => {
      cancelled = true;
      if (jobChannel) {
        supabase.removeChannel(jobChannel);
      }
      if (outputChannel) {
        supabase.removeChannel(outputChannel);
      }
    };
  }, [appendOutput, mergeItems, removeItem]);

  const filteredItems = useMemo(() => {
    if (!items.length) {
      return [] as CreationItem[];
    }

    return items.filter((item) => matchesCategory(item, activeCategory));
  }, [items, activeCategory]);

  const displayTasks = useMemo(
    () => filteredItems.map(toDisplayTask),
    [filteredItems]
  );

  const hasProcessingTasks = useMemo(
    () => items.some((item) => mapStatus(item.latestStatus ?? item.status) === "processing"),
    [items]
  );

  useEffect(() => {
    if (!hasProcessingTasks) {
      return;
    }

    const controller = new AbortController();
    const tick = () => {
      void loadHistory({ page: 0, signal: controller.signal });
    };

    const intervalId = window.setInterval(tick, POLL_INTERVAL_MS);
    tick();

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [hasProcessingTasks, loadHistory]);

  useEffect(() => {
    if (!hasMore) {
      return;
    }

    const node = loadMoreRef.current;
    if (!node) {
      return;
    }

    const viewport = node.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.isIntersecting) {
        void handleLoadMore();
      }
    }, { root: viewport ?? undefined, rootMargin: "120px" });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [handleLoadMore, hasMore]);

  useEffect(() => {
    return () => {
      prefetchAbortControllersRef.current.forEach((controller) => controller.abort());
      prefetchAbortControllersRef.current.clear();
      prefetchingSlugsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const succeededSlugs = displayTasks
      .filter((task) => task.status === "succeeded" && task.shareSlug)
      .map((task) => task.shareSlug!) as string[];

    if (!hasCapturedInitialSlugsRef.current) {
      if (isLoading) {
        return;
      }
      hasCapturedInitialSlugsRef.current = true;
      previousSucceededSlugsRef.current = new Set(succeededSlugs);
      return;
    }

    let slugToPrefetch: string | null = null;
    for (const slug of succeededSlugs) {
      if (!previousSucceededSlugsRef.current.has(slug)) {
        slugToPrefetch = slug;
        break;
      }
    }

    previousSucceededSlugsRef.current = new Set(succeededSlugs);

    if (!slugToPrefetch) {
      return;
    }

    if (
      prefetchedJobsRef.current.has(slugToPrefetch) ||
      prefetchingSlugsRef.current.has(slugToPrefetch)
    ) {
      return;
    }

    const slug = slugToPrefetch;
    const controller = new AbortController();
    prefetchingSlugsRef.current.add(slug);
    prefetchAbortControllersRef.current.set(slug, controller);

    fetch(`/api/viewer/${slug}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const json = await response.json().catch(() => ({}));
          throw new Error(json?.error ?? "加载失败");
        }
        const json = await response.json();
        if (!json?.success || !json?.data) {
          throw new Error(json?.error ?? "加载失败");
        }
        const job = json.data as ViewerJob;
        prefetchedJobsRef.current.set(slug, job);

        if (previewTask?.shareSlug === slug) {
          setViewerJob(job);
          setIsViewerLoading(false);
          setViewerError(null);
        }
      })
      .catch((error: any) => {
        if (controller.signal.aborted) {
          return;
        }
        console.warn("[TextToImageRecentTasks] prefetch failed", error);
      })
      .finally(() => {
        prefetchingSlugsRef.current.delete(slug);
        prefetchAbortControllersRef.current.delete(slug);
      });
  }, [displayTasks, isLoading, previewTask]);

  const handleOpenViewer = useCallback(
    (task: DisplayTask) => {
      if (!task.shareSlug) {
        return;
      }

      const slug = task.shareSlug;

      if (viewerFetchRef.current) {
        viewerFetchRef.current.abort();
        viewerFetchRef.current = null;
      }

      setPreviewTask(task);
      setViewerError(null);

      const cachedJob = prefetchedJobsRef.current.get(slug) ?? null;
      if (cachedJob) {
        setViewerJob(cachedJob);
        setIsViewerLoading(false);
      } else {
        setViewerJob(null);
        setIsViewerLoading(true);
      }

      const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
      if (typeof window !== "undefined") {
        const nextUrl = `${localePrefix}/v/${slug}`;
        window.history.pushState({ modal: slug }, "", nextUrl);
      } else {
        router.push(`${localePrefix}/v/${slug}`, { scroll: false });
      }

      if (cachedJob || prefetchingSlugsRef.current.has(slug)) {
        return;
      }

      const controller = new AbortController();
      viewerFetchRef.current = controller;

      fetch(`/api/viewer/${slug}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            throw new Error(json?.error ?? "加载失败");
          }
          const json = await response.json();
          if (!json?.success || !json?.data) {
            throw new Error(json?.error ?? "加载失败");
          }
          const job = json.data as ViewerJob;
          prefetchedJobsRef.current.set(slug, job);
          setViewerJob(job);
        })
        .catch((error: any) => {
          if (controller.signal.aborted) {
            return;
          }
          setViewerError(error?.message ?? "加载失败");
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
    [locale, router]
  );

  const closePreview = useCallback(() => {
    if (viewerFetchRef.current) {
      viewerFetchRef.current.abort();
      viewerFetchRef.current = null;
    }
    setPreviewTask(null);
    setViewerJob(null);
    setViewerError(null);
    setIsViewerLoading(false);
  }, []);

  const renderMedia = (task: DisplayTask) => {
    if (!task.media) {
      return null;
    }

    const viewerSlug = task.shareSlug;
    const canPreview = Boolean(viewerSlug) && task.status === "succeeded";

    const wrapWithInteraction = (node: ReactNode, opts?: { wide?: boolean }) => {
      const widthClass = opts?.wide ? "w-full max-w-[480px]" : "w-full max-w-[260px]";
      if (!canPreview) {
        return <div className={widthClass}>{node}</div>;
      }

      const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpenViewer(task);
        }
      };

      return (
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleOpenViewer(task)}
          onKeyDown={handleKeyDown}
          className={cn(
            "group relative block cursor-pointer focus:outline-none",
            widthClass,
            "transition"
          )}
        >
          {node}
          <span className="pointer-events-none absolute inset-0 rounded-lg border border-white/20 bg-black/40 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            查看详情
          </span>
        </div>
      );
    };

    if (task.media.kind === "video") {
      if (task.media.url) {
        const videoNode = (
          <video
            src={task.media.url}
            poster={task.media.thumbUrl ?? undefined}
            className="w-full h-auto rounded-lg border border-white/10 bg-black/40"
            controls
            preload="metadata"
          />
        );
        return wrapWithInteraction(videoNode);
      }
      if (task.media.thumbUrl) {
        const thumbNode = (
          <Image
            src={task.media.thumbUrl}
            alt="Video preview"
            width={720}
            height={405}
            className="w-full h-auto rounded-lg border border-white/10 object-cover"
            unoptimized
          />
        );
        return wrapWithInteraction(thumbNode);
      }
      return null;
    }

    if (task.media.kind === "audio") {
      if (!task.media.url) {
        return null;
      }
      const audioNode = (
        <AudioPlayer
          src={task.media.url}
          durationSeconds={task.media.durationSeconds ?? undefined}
          className="w-full"
        />
      );
      return wrapWithInteraction(audioNode, { wide: true });
    }

    const imageSrc = task.media.url ?? task.media.thumbUrl;
    if (!imageSrc) {
      return null;
    }

    const imageNode = (
      <Image
        src={imageSrc}
        alt="生成结果"
        width={512}
        height={512}
        className="w-full h-auto rounded-lg border border-white/10 object-cover"
        unoptimized
      />
    );

    return wrapWithInteraction(imageNode);
  };

  const handleShare = useCallback(
    async (task: DisplayTask) => {
      if (!task.shareSlug) {
        toast.error("暂未生成分享链接");
        return;
      }

      const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
      const shareUrl = `${window.location.origin}${localePrefix}/v/${task.shareSlug}?source=share`;

      if (navigator.share) {
        try {
          await navigator.share({ url: shareUrl });
          toast.success("已打开系统分享");
        } catch (error) {
          console.warn("[history-share] native share cancelled", error);
        }
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("链接已复制");
        } catch (error) {
          console.error("[history-share] copy failed", error);
          toast.error("复制失败，请手动复制");
        }
        return;
      }

      window.prompt("复制链接", shareUrl);
    },
    [locale]
  );

  const handleCopyLink = useCallback(
    async (task: DisplayTask) => {
      if (typeof window === "undefined") {
        return;
      }

      if (!task.shareSlug) {
        toast.error("暂未生成分享链接");
        return;
      }

      const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
      const shareUrl = `${window.location.origin}${localePrefix}/v/${task.shareSlug}?source=share`;

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("链接已复制");
          return;
        } catch (error) {
          console.error("[history-copy] clipboard failed", error);
        }
      }

      window.prompt("复制链接", shareUrl);
    },
    [locale]
  );

  const handleRequestDelete = useCallback((task: DisplayTask) => {
    setTaskToDelete(task);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!taskToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/ai/my-creations/${taskToDelete.id}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.success) {
        const message = result?.error ?? response.statusText ?? "删除失败";
        throw new Error(message);
      }

      removeItem(taskToDelete.id);
      if (taskToDelete.shareSlug) {
        prefetchedJobsRef.current.delete(taskToDelete.shareSlug);
        previousSucceededSlugsRef.current.delete(taskToDelete.shareSlug);
      }

      setTaskToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "删除失败，请稍后重试";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }, [taskToDelete, removeItem]);

  useEffect(() => {
    if (!previewTask || typeof window === "undefined") {
      return;
    }

    const handlePopState = () => {
      closePreview();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [previewTask, closePreview]);

  useEffect(() => {
    return () => {
      if (viewerFetchRef.current) {
        viewerFetchRef.current.abort();
        viewerFetchRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const viewport = scrollViewportEl;
    if (!viewport) {
      setShowScrollTop(false);
      return;
    }

    const handleScroll = () => {
      setShowScrollTop(viewport.scrollTop > 160);
    };

    viewport.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, [scrollViewportEl, displayTasks.length]);

  const scrollToTop = useCallback(() => {
    if (!scrollViewportEl) {
      return;
    }
    scrollViewportEl.scrollTo({ top: 0, behavior: "smooth" });
    setTrackedGeneration((prev) => {
      const hasProcessing = Object.values(prev).some((status) => status === "processing");
      if (hasProcessing || Object.keys(prev).length === 0) {
        return prev;
      }
      return {};
    });
  }, [scrollViewportEl]);

  useEffect(() => {
    setTrackedGeneration((prev) => {
      let next = prev;
      const ensureNext = () => {
        if (next === prev) {
          next = { ...prev };
        }
      };

      const observedIds = new Set<string>();

      displayTasks.forEach((task) => {
        if (task.status === "processing") {
          observedIds.add(task.id);
          if (prev[task.id] !== "processing") {
            ensureNext();
            next[task.id] = "processing";
          }
        } else if (task.status === "succeeded") {
          if (prev[task.id]) {
            observedIds.add(task.id);
            if (prev[task.id] !== "completed") {
              ensureNext();
              next[task.id] = "completed";
            }
          }
        } else if (prev[task.id]) {
          ensureNext();
          delete next[task.id];
        }
      });

      Object.keys(prev).forEach((id) => {
        if (!observedIds.has(id)) {
          ensureNext();
          delete next[id];
        }
      });

      return next;
    });
  }, [displayTasks]);

  const generationCounts = useMemo(() => {
    const statuses = Object.values(trackedGeneration);
    const total = statuses.length;
    const completed = statuses.filter((status) => status === "completed").length;
    const processing = total - completed;
    return { total, completed, processing };
  }, [trackedGeneration]);

  const generationIndicator = useMemo(() => {
    if (generationCounts.total === 0) {
      return null;
    }

    if (generationCounts.processing > 0) {
      const text = `Generating ${generationCounts.processing} result${generationCounts.processing > 1 ? "s" : ""} (${generationCounts.completed}/${generationCounts.total})`;
      return {
        text,
        showSpinner: true,
        ariaLabel: `回到顶部，当前生成中 ${generationCounts.processing} 个任务`,
      };
    }

    return {
      text: `Generated(${generationCounts.completed}/${generationCounts.total})`,
      showSpinner: false,
      ariaLabel: `回到顶部，最近完成 ${generationCounts.completed}/${generationCounts.total} 个任务`,
    };
  }, [generationCounts]);

  let content: ReactNode = null;

  if (isLoading) {
    content = (
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 space-y-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  } else if (isUnauthorized) {
    content = (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-10 text-white/70">
        请登录后查看生成记录。
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 p-10 text-rose-100">
        {error}
      </div>
    );
  } else if (!displayTasks.length) {
    content = (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-10 text-white/60">
        暂无生成记录。
      </div>
    );
  } else {
    content = (
      <div className="relative flex-1 min-h-0">
        <ScrollArea className="h-full" viewportRef={handleViewportRef}>
          <div className="pr-3 space-y-4">
            {displayTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 space-y-4"
              >
              <header className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-white/10 bg-white/10 text-white">
                  <AvatarFallback className="text-xs font-semibold bg-transparent text-white">
                    {task.provider.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col justify-center gap-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium leading-none text-white">
                        {task.provider}
                      </span>
                      <Badge className="border-white/10 bg-white/10 text-white/80">
                        {task.typeLabel}
                      </Badge>
                      {!task.effectSlug && (
                        <Badge className="border-white/10 bg-white/5 text-white/60">
                          {task.modelLabel}
                        </Badge>
                      )}
                      {task.effectSlug && !hideEffectBadge ? (
                        <Badge className="border-pink-500/20 bg-pink-500/10 text-pink-200">
                          特效 · {task.effectTitle ?? task.effectSlug}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span>{task.createdAtLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 text-white/60 hover:text-white hover:bg-white/10",
                      task.favorite && "text-pink-400 hover:text-pink-300"
                    )}
                    aria-label={task.favorite ? "Remove from favorites" : "Mark as favorite"}
                    disabled
                  >
                    <Heart
                      className="h-4 w-4"
                      fill={task.favorite ? "currentColor" : "none"}
                    />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                        aria-label="更多操作"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40 border border-white/10 bg-[#1c1c1a] text-white shadow-lg"
                    >
                      <DropdownMenuItem
                        className="focus:bg-transparent focus:text-[#dc2e5a] focus:[&_svg]:text-[#dc2e5a]"
                        disabled={task.status !== "succeeded" || !task.shareSlug}
                        onSelect={() => {
                          void handleCopyLink(task);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                        <span>复制链接</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        className="focus:bg-transparent focus:text-[#dc2e5a] focus:[&_svg]:text-[#dc2e5a]"
                        onSelect={() => {
                          handleRequestDelete(task);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>删除</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>

              <div className="space-y-2">
                {!task.effectSlug && (
                  <>
                    <p className="text-sm text-white/70 leading-relaxed">
                      <span className="text-white">Prompt:</span>{" "}
                      {task.prompt || "—"}
                    </p>
                    {task.negativePrompt ? (
                      <p className="text-xs text-white/50">
                        <span className="text-white/70">Negative:</span>{" "}
                        {task.negativePrompt}
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              {task.status === "failed" && task.errorMessage ? (
                <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                  <span>{task.errorMessage}</span>
                </div>
              ) : null}

              {task.status === "succeeded"
                ? renderMedia(task)
                : task.status === "processing"
                ? (
                    <div className="flex w-full max-w-[260px] items-center justify-center rounded-lg border border-white/10 bg-white/5 px-6 py-10">
                      <div className="flex flex-col items-center gap-3 text-white/70">
                        <span className="block h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                        <span className="text-xs">生成中...</span>
                      </div>
                    </div>
                  )
                : null}

              <footer className="flex items-center gap-2 text-xs text-white/50">
                {!task.effectSlug ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                        aria-label="重新编辑提示词"
                        onClick={() => void handleReprompt(task.id)}
                      >
                        <PenSquare className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Reprompt</TooltipContent>
                  </Tooltip>
                ) : null}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 text-white/60 hover:text-white hover:bg-[#dc2e5a]",
                        isRegenerating(task.id) && "cursor-wait",
                        task.status !== "succeeded" && "cursor-not-allowed opacity-40 hover:text-white/60 hover:bg-transparent"
                      )}
                      aria-label="重新生成新任务"
                      disabled={isRegenerating(task.id) || task.status !== "succeeded"}
                      onClick={() => void handleRegenerate(task.id)}
                    >
                      <RefreshCcw
                        className={cn(
                          "h-4 w-4",
                          isRegenerating(task.id) && "animate-spin"
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Regenerator</TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  aria-label="Download output"
                  disabled={task.status !== "succeeded" || !task.media || !task.media.url}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  aria-label="Share result"
                  disabled={task.status !== "succeeded" || !task.shareSlug}
                  onClick={() => handleShare(task)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                {isRegenerating(task.id) ? (
                  <span className="ml-2 text-white/60">重新生成中...</span>
                ) : task.status !== "succeeded" ? (
                  <span className="ml-2">
                    {task.status === "failed"
                      ? "Retry available soon"
                      : "生成中..."}
                  </span>
                ) : null}
              </footer>
            </article>
          ))}
          <div
            ref={loadMoreRef}
            className="py-4 text-center text-xs text-white/50"
          >
            {hasMore
              ? isLoadingMore
                ? "加载中..."
                : "继续下拉加载更多"
              : "没有更多内容啦"}
          </div>
          </div>
        </ScrollArea>
        {showScrollTop ? (
          <Button
            variant="secondary"
            className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white hover:bg-white/25"
            onClick={scrollToTop}
            aria-label={generationIndicator?.ariaLabel ?? "回到顶部"}
          >
            {generationIndicator ? (
              <div className="flex items-center gap-2">
                {generationIndicator.showSpinner ? (
                  <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                    <span className="block h-full w-full animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  </span>
                ) : (
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#dc2e5a]">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                )}
                <span className="leading-none">{generationIndicator.text}</span>
              </div>
            ) : null}
            <ArrowUp className="h-4 w-4 shrink-0" />
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col text-white">
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <Select
          value={activeCategory}
          onValueChange={(value) => setActiveCategory(value as CategoryFilter)}
        >
          <SelectTrigger className="w-[160px] bg-white/5 border border-white/10 text-white/80 focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder={normalizedCategories[0] ?? "全部"} />
          </SelectTrigger>
          <SelectContent className="bg-[#1c1c1a] text-white border border-white/10">
            {CATEGORY_OPTIONS.filter((option) => normalizedCategories.includes(option.key)).map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center text-sm text-white/70" />
      </div>
      {content}
      <Dialog
        open={Boolean(previewTask)}
        onOpenChange={(open) => {
          if (!open && previewTask) {
            if (typeof window !== "undefined") {
              window.history.back();
            } else {
              closePreview();
            }
          }
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] border border-white/10 bg-[#1c1c1a] text-white sm:max-w-[68rem]">
          {isViewerLoading ? (
            <div className="flex h-[60vh] w-full items-center justify-center text-white/60">
              加载中...
            </div>
          ) : viewerError ? (
            <div className="flex h-[60vh] w-full items-center justify-center text-white/60">
              {viewerError}
            </div>
          ) : viewerJob ? (
            <ViewerBoard
              job={viewerJob}
              shareUrl={`${typeof window !== "undefined" ? window.location.origin : siteConfig.url}${
                locale === DEFAULT_LOCALE ? "" : `/${locale}`
              }/v/${viewerJob.shareSlug ?? viewerJob.id}?source=share`}
            />
          ) : (
            <div className="flex h-[40vh] w-full items-center justify-center text-white/60">
              暂无预览内容
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            if (isDeleting) {
              return;
            }
            setTaskToDelete(null);
          }
        }}
      >
        <AlertDialogContent className="border border-white/10 bg-[#1c1c1a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除生成记录？</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              删除后将无法恢复该条生成记录及其输出。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-white/20 text-black hover:bg-white/10 hover:text-white"
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
              className="bg-[#dc2e5a] text-white hover:bg-[#f0446e]"
            >
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
