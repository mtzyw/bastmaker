"use client";

import dayjs from "dayjs";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { ViewerJob } from "@/actions/ai-jobs/public";
import { getUserCreationsHistory } from "@/actions/creations";
import { TEXT_TO_IMAGE_DEFAULT_MODEL, getTextToImageOptionValue } from "@/components/ai/text-image-models";
import { DEFAULT_VIDEO_MODEL } from "@/components/ai/video-models";
import { ShareDialog } from "@/components/ShareDialog";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ViewerBoard } from "@/components/viewer/ViewerBoard";
import { siteConfig } from "@/config/site";
import { DEFAULT_LOCALE, useRouter } from "@/i18n/routing";
import { buildRegenerationPlan, buildRepromptDraft, type RegenerationPlan, type RepromptDraft } from "@/lib/ai/creation-retry";
import { useSubscriptionPopup } from "@/components/providers/SubscriptionPopupProvider";
import { CreationItem, CreationOutput } from "@/lib/ai/creations";
import { getSoundEffectModelConfig } from "@/lib/ai/sound-effect-config";
import { getTextToImageModelConfig } from "@/lib/ai/text-to-image-config";
import { getVideoModelConfig } from "@/lib/ai/video-config";
import { downloadBase64File, downloadViaProxy } from "@/lib/downloadFile";
import { useDownloadAccess } from "@/hooks/useDownloadAccess";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { useCreationHistoryStore } from "@/stores/creationHistoryStore";
import { useRepromptStore } from "@/stores/repromptStore";
import AudioPlayer from "@components/audio-player";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { AlertTriangle, ArrowUp, Check, Clapperboard, Copy, Crown, Download, Heart, ImageUp, MoreHorizontal, PenSquare, RefreshCcw, Share2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

const CATEGORY_KEYS = ["全部", "视频", "图片", "特效", "音效"] as const;
type CategoryFilter = typeof CATEGORY_KEYS[number];
type CategoryKey = "all" | "video" | "image" | "effect" | "audio";
const CATEGORY_KEY_MAP: Record<CategoryFilter, CategoryKey> = {
  全部: "all",
  视频: "video",
  图片: "image",
  特效: "effect",
  音效: "audio",
};

const DEFAULT_CATEGORY_ORDER: readonly CategoryFilter[] = CATEGORY_KEYS;

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
  metadataSource?: string | null;
};

function getMediaUrl(media?: TaskMedia) {
  if (!media) {
    return null;
  }
  const candidate = (media as { url?: string | null }).url;
  return typeof candidate === "string" && candidate.length > 0 ? candidate : null;
}

function getMediaThumbUrl(media?: TaskMedia) {
  if (!media) {
    return null;
  }
  if ("thumbUrl" in media) {
    const candidate = (media as { thumbUrl?: string | null }).thumbUrl;
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }
  return null;
}

type DownloadTargets = {
  watermarkUrl: string | null;
  originalUrl: string | null;
};

const CATEGORY_MODALITY_MAP: Record<CategoryKey, readonly string[] | undefined> = {
  all: undefined,
  video: ["t2v", "i2v"],
  image: ["t2i", "i2i"],
  effect: undefined,
  audio: ["t2a"],
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

function inferFileExtension(url?: string | null, fallback: string = "png") {
  if (!url) {
    return fallback;
  }
  const clean = url.split(/[?#]/)[0] ?? "";
  const match = clean.match(/\.([a-zA-Z0-9]+)$/);
  if (!match) {
    return fallback;
  }
  const ext = match[1].toLowerCase();
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

function buildDownloadFileName(task: DisplayTask, variant: "watermark" | "clean", extension: string) {
  const stem =
    sanitizeFileStem(task.prompt) ??
    sanitizeFileStem(task.modelLabel) ??
    `nexty-${task.id.slice(0, 6)}`;
  const suffix = variant === "watermark" ? "-wm" : "-clean";
  return `${stem}${suffix}.${extension}`;
}

type TextToImageRecentTasksProps = {
  initialCategory?: CategoryFilter;
  categories?: readonly CategoryFilter[];
  hideEffectBadge?: boolean;
  fallbackMediaUrl?: string;
};

type TrackedGenerationStatus = "processing" | "completed";

function formatProviderName(code?: string | null) {
  if (!code) {
    return "Unknown";
  }
  return PROVIDER_DISPLAY_NAMES[code] ?? code.replace(/^[a-z]/, (c) => c.toUpperCase());
}

function matchesCategory(item: CreationItem, category: CategoryFilter) {
  const categoryKey = CATEGORY_KEY_MAP[category];
  if (categoryKey === "all") {
    return true;
  }
  if (categoryKey === "effect") {
    const effectSlug =
      typeof item.metadata?.effect_slug === "string" && item.metadata.effect_slug.length > 0
        ? item.metadata.effect_slug
        : typeof item.inputParams?.effect_slug === "string"
          ? item.inputParams.effect_slug
          : null;
    return Boolean(effectSlug);
  }
  const allowed = CATEGORY_MODALITY_MAP[categoryKey];
  if (!allowed || allowed.length === 0) {
    return true;
  }
  const modality = getModality(item);
  if (!modality) {
    return categoryKey === "image";
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
      durationSeconds: imageOutput.durationSeconds ?? null,
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
      durationSeconds: videoOutput.durationSeconds ?? null,
    };
  }

  const audioOutput = outputs.find((output) =>
    (output.type ?? "").toLowerCase().startsWith("audio")
  );
  if (audioOutput && audioOutput.url) {
    const durationValue = Number.isFinite(audioOutput.durationSeconds ?? NaN)
      ? Number(audioOutput.durationSeconds)
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
      durationSeconds: fallback.durationSeconds ?? null,
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
    shareSlug: row.share_slug,
    shareVisitCount: row.share_visit_count ?? 0,
    shareConversionCount: row.share_conversion_count ?? 0,
    publicTitle: row.public_title ?? null,
    publicSummary: row.public_summary ?? null,
  };
}

function mapOutputRowToCreationOutput(row: AiJobOutputRow): CreationOutput {
  return {
    id: row.id,
    url: row.url,
    thumbUrl: row.thumb_url,
    type: row.type,
    createdAt: row.created_at,
    durationSeconds: row.duration,
  };
}

function toDisplayTask(job: CreationItem): DisplayTask {
  const effectiveStatus = job.latestStatus ?? job.status;
  const effectSlug =
    typeof job.metadata?.effect_slug === "string" ? job.metadata.effect_slug : null;
  const effectTitle =
    typeof job.metadata?.effect_title === "string" ? job.metadata.effect_title : null;
  const metadataSource =
    typeof job.metadata?.source === "string" ? job.metadata.source : null;
  const promptValue = parsePrompt(job.inputParams?.prompt ?? job.inputParams?.text ?? job.metadata?.prompt);
  const showPrompt = metadataSource !== "lip-sync";

  return {
    id: job.jobId,
    provider: formatProviderName(job.providerCode),
    modalityCode: getModality(job),
    typeLabel: getTypeLabel(job),
    modelLabel: getModelLabel(job),
    createdAtLabel: dayjs(job.createdAt).format("MM-DD HH:mm"),
    prompt: showPrompt ? promptValue : "",
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
    metadataSource,
  };
}

export default function TextToImageRecentTasks({
  initialCategory = "全部",
  categories = DEFAULT_CATEGORY_ORDER,
  hideEffectBadge = false,
  fallbackMediaUrl,
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
  const localePrefix = useMemo(() => (locale === DEFAULT_LOCALE ? "" : `/${locale}`), [locale]);
  const router = useRouter();
  const historyT = useTranslations("CreationHistory");
  const { openSubscriptionPopup } = useSubscriptionPopup();
  const { benefits, isLoading: benefitsLoading } = useUserBenefits();
  const { ensureDownloadAllowed } = useDownloadAccess({
    benefits,
    isLoading: benefitsLoading,
  });
  const promptLabel = historyT("labels.prompt");
  const negativeLabel = historyT("labels.negative");
  const categoryFilterLabel = historyT("labels.categoryFilter");
  const effectBadgeLabel = historyT("categories.effect");
  const downloadWatermarkLabel = historyT("actions.downloadWatermark");
  const downloadCleanLabel = historyT("actions.downloadClean");
  const downloadActionLabel = historyT("viewer.download");
  const usePromptLabel = historyT("actions.usePrompt");
  const retryLabel = historyT("actions.retry");
  const imageToImageLabel = historyT("actions.imageToImage");
  const imageToVideoLabel = historyT("actions.imageToVideo");
  const moreActionsLabel = historyT("actions.more");
  const generatingLabel = historyT("messages.generating");
  const loadingLabel = historyT("messages.loading");
  const loadMoreLabel = historyT("messages.loadMore");
  const noMoreLabel = historyT("messages.noMore");
  const emptyLabel = historyT("messages.empty");
  const deleteConfirmTitle = historyT("messages.deleteConfirmTitle");
  const deleteConfirmDescription = historyT("messages.deleteConfirmDescription");
  const deleteCancelLabel = historyT("messages.deleteCancel");
  const deleteConfirmLabel = historyT("messages.deleteConfirm");
  const deletingLabel = historyT("messages.deleting");
  const previewAlt = historyT("viewer.previewAlt");
  const getCategoryLabel = useCallback(
    (category: CategoryFilter) => historyT(`categories.${CATEGORY_KEY_MAP[category]}`),
    [historyT]
  );
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [taskToShare, setTaskToShare] = useState<DisplayTask | null>(null);
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
  const [downloadMenuTaskId, setDownloadMenuTaskId] = useState<string | null>(null);
  const downloadMenuCloseTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const shouldShowCategoryFilter = normalizedCategories.length > 1;

  const fetchInFlightRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const handleViewportRef = useCallback((node: HTMLDivElement | null) => {
    setScrollViewportEl(node);
  }, []);
  const isRegenerating = useCallback(
    (jobId: string) => regeneratingIds.has(jobId),
    [regeneratingIds]
  );
  const handleCategoryChange = useCallback(
    (category: CategoryFilter) => {
      if (category === activeCategory) {
        return;
      }
      setActiveCategory(category);
    },
    [activeCategory, setActiveCategory]
  );

  const resolvePrimaryImageUrl = useCallback(
    (task: DisplayTask): string | null => {
      if (task.media?.kind === "image" && (task.media.url || task.media.thumbUrl)) {
        return task.media.url ?? task.media.thumbUrl ?? null;
      }

      const original = itemMap.get(task.id);
      if (!original) {
        return null;
      }

      const outputs = Array.isArray(original.outputs) ? original.outputs : [];
      const imageOutput = outputs.find(
        (output) =>
          typeof output?.type === "string" &&
          output.type.toLowerCase().startsWith("image") &&
          typeof output.url === "string" &&
          output.url.length > 0
      );
      if (imageOutput?.url) {
        return imageOutput.url;
      }

      const referenceUrls = Array.isArray(original.metadata?.reference_image_urls)
        ? (original.metadata.reference_image_urls as unknown[])
          .map((value) => (typeof value === "string" ? value : ""))
          .filter((value): value is string => value.length > 0)
        : [];
      if (referenceUrls.length > 0) {
        return referenceUrls[0];
      }

      if (typeof original.metadata?.primary_image_url === "string" && original.metadata.primary_image_url.length > 0) {
        return original.metadata.primary_image_url;
      }

      if (typeof original.inputParams?.image_url === "string" && original.inputParams.image_url.length > 0) {
        return original.inputParams.image_url;
      }

      return null;
    },
    [itemMap]
  );

  const resolveDownloadTargets = useCallback(
    (task: DisplayTask): DownloadTargets => {
      const primaryMediaUrl = getMediaUrl(task.media);
      const fallback: DownloadTargets = {
        watermarkUrl: getMediaThumbUrl(task.media) ?? primaryMediaUrl,
        originalUrl: primaryMediaUrl,
      };

      const original = itemMap.get(task.id);
      if (!original) {
        return fallback;
      }

      const outputs = Array.isArray(original.outputs) ? original.outputs : [];
      const selectPrimary = (predicate: (output: CreationOutput) => boolean) =>
        outputs.find((output) => {
          if (typeof output !== "object" || !output) {
            return false;
          }
          return predicate(output);
        });

      const primaryImage = selectPrimary(
        (output) => typeof output.type === "string" && output.type.toLowerCase().startsWith("image")
      );
      const primaryVideo = selectPrimary(
        (output) => typeof output.type === "string" && output.type.toLowerCase().startsWith("video")
      );
      const primaryAudio = selectPrimary(
        (output) => typeof output.type === "string" && output.type.toLowerCase().startsWith("audio")
      );

      const primary =
        primaryImage ??
        primaryVideo ??
        primaryAudio ??
        (outputs.length > 0 ? outputs[0] : undefined);

      const metadata = (original.metadata ?? {}) as Record<string, unknown>;

      const originalCandidates: Array<string | null> = [
        typeof primary?.url === "string" ? primary.url : null,
        typeof metadata.output_url === "string" ? metadata.output_url : null,
        typeof metadata.outputUrl === "string" ? metadata.outputUrl : null,
        typeof metadata.download_url === "string" ? metadata.download_url : null,
        typeof metadata.downloadUrl === "string" ? metadata.downloadUrl : null,
        typeof metadata.asset_url === "string" ? metadata.asset_url : null,
        typeof metadata.assetUrl === "string" ? metadata.assetUrl : null,
        typeof metadata.original_url === "string" ? metadata.original_url : null,
        typeof metadata.originalUrl === "string" ? metadata.originalUrl : null,
        typeof metadata.result_url === "string" ? metadata.result_url : null,
        typeof metadata.resultUrl === "string" ? metadata.resultUrl : null,
      ];

      const watermarkCandidates: Array<string | null> = [
        typeof primary?.thumbUrl === "string" ? primary.thumbUrl : null,
        typeof metadata.watermarked_url === "string" ? metadata.watermarked_url : null,
        typeof metadata.watermarkedUrl === "string" ? metadata.watermarkedUrl : null,
        typeof metadata.watermark_url === "string" ? metadata.watermark_url : null,
        typeof metadata.watermarkUrl === "string" ? metadata.watermarkUrl : null,
        typeof metadata.preview_url === "string" ? metadata.preview_url : null,
        typeof metadata.previewUrl === "string" ? metadata.previewUrl : null,
        typeof metadata.thumb_url === "string" ? metadata.thumb_url : null,
        typeof metadata.thumbUrl === "string" ? metadata.thumbUrl : null,
      ];

      const originalUrl =
        originalCandidates.find((value): value is string => Boolean(value && value.length > 0)) ??
        fallback.originalUrl;
      const watermarkUrl =
        watermarkCandidates.find((value): value is string => Boolean(value && value.length > 0)) ??
        fallback.watermarkUrl;

      return {
        originalUrl: originalUrl ?? null,
        watermarkUrl: watermarkUrl ?? null,
      };
    },
    [itemMap]
  );

  const handleReprompt = useCallback(
    (jobId: string) => {
      const original = itemMap.get(jobId);
      if (!original) {
        toast.error(historyT("messages.promptMissing"));
        return;
      }
      if (original.metadata?.effect_slug) {
        toast.error(historyT("messages.promptNotAllowed"));
        return;
      }
      try {
        const draft = buildRepromptDraft(original);
        setRepromptDraft(draft);
        const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
        router.push(`${localePrefix}${draft.route}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : historyT("messages.retryFailed");
        toast.error(message);
      }
    },
    [itemMap, locale, router, setRepromptDraft]
  );

  const handleStartImageToImage = useCallback(
    (task: DisplayTask) => {
      const original = itemMap.get(task.id);
      if (!original) {
        toast.error(historyT("messages.imageUnavailable"));
        return;
      }

      const imageUrl = resolvePrimaryImageUrl(task);
      if (!imageUrl) {
        toast.error(historyT("messages.imageUnavailable"));
        return;
      }

      const modelSlug =
        (typeof original.modelSlug === "string" && original.modelSlug.length > 0 && original.modelSlug) ||
        (typeof original.inputParams?.model === "string" ? original.inputParams.model : TEXT_TO_IMAGE_DEFAULT_MODEL);
      const uiModelValue =
        getTextToImageOptionValue(modelSlug) ??
        (typeof modelSlug === "string" && modelSlug.length > 0 ? modelSlug : TEXT_TO_IMAGE_DEFAULT_MODEL);

      const draft: RepromptDraft = {
        kind: "image-to-image",
        route: "/image-to-image",
        prompt: "",
        translatePrompt: false,
        model: uiModelValue,
        referenceImageUrls: [imageUrl],
      };

      setRepromptDraft(draft);
      const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
      router.push(`${localePrefix}${draft.route}`);
    },
    [itemMap, locale, resolvePrimaryImageUrl, router, setRepromptDraft]
  );

  const handleStartImageToVideo = useCallback(
    (task: DisplayTask) => {
      const original = itemMap.get(task.id);
      if (!original) {
        toast.error(historyT("messages.imageUnavailable"));
        return;
      }

      const imageUrl = resolvePrimaryImageUrl(task);
      if (!imageUrl) {
        toast.error(historyT("messages.imageUnavailable"));
        return;
      }

      const draft: RepromptDraft = {
        kind: "image-to-video",
        route: "/image-to-video",
        prompt: "",
        translatePrompt: false,
        model: DEFAULT_VIDEO_MODEL,
        mode: "image",
        primaryImageUrl: imageUrl,
        aspectRatio: task.aspectRatio ?? undefined,
      };

      setRepromptDraft(draft);
      const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
      router.push(`${localePrefix}${draft.route}`);
    },
    [itemMap, locale, resolvePrimaryImageUrl, router, setRepromptDraft]
  );

  const clearDownloadMenuCloseTimeout = useCallback(() => {
    if (downloadMenuCloseTimeoutRef.current) {
      clearTimeout(downloadMenuCloseTimeoutRef.current);
      downloadMenuCloseTimeoutRef.current = null;
    }
  }, []);

  const closeDownloadMenu = useCallback(
    (taskId?: string) => {
      clearDownloadMenuCloseTimeout();
      setDownloadMenuTaskId((current) => {
        if (!taskId) {
          return null;
        }
        return current === taskId ? null : current;
      });
    },
    [clearDownloadMenuCloseTimeout]
  );

  const openDownloadMenu = useCallback(
    (taskId: string, disabled: boolean) => {
      if (disabled) {
        return;
      }
      clearDownloadMenuCloseTimeout();
      setDownloadMenuTaskId(taskId);
    },
    [clearDownloadMenuCloseTimeout]
  );

  const scheduleDownloadMenuClose = useCallback(
    (taskId: string) => {
      clearDownloadMenuCloseTimeout();
      downloadMenuCloseTimeoutRef.current = window.setTimeout(() => {
        closeDownloadMenu(taskId);
      }, 120) as unknown as ReturnType<typeof setTimeout>;
    },
    [clearDownloadMenuCloseTimeout, closeDownloadMenu]
  );

  useEffect(() => {
    return () => {
      clearDownloadMenuCloseTimeout();
    };
  }, [clearDownloadMenuCloseTimeout]);

  const handleDownloadOptionClick = useCallback(
    async (task: DisplayTask, variant: "watermark" | "clean") => {
      if (!ensureDownloadAllowed()) {
        return;
      }
      const targets = resolveDownloadTargets(task);
      const targetUrl = variant === "watermark" ? targets.watermarkUrl : targets.originalUrl;
      if (!targetUrl) {
        toast.error(
          variant === "watermark"
            ? historyT("messages.downloadUnavailableWatermark")
            : historyT("messages.downloadUnavailableClean")
        );
        return;
      }

      const fallbackExt =
        task.media?.kind === "video"
          ? "mp4"
          : task.media?.kind === "audio"
            ? "mp3"
            : "png";
      const extension = inferFileExtension(targetUrl, fallbackExt);
      const fileName = buildDownloadFileName(task, variant, extension);

      closeDownloadMenu(task.id);

      const trimmedUrl = targetUrl.trim();

      if (trimmedUrl.startsWith("data:")) {
        downloadBase64File(trimmedUrl, fileName);
        return;
      }

      const proxied = await downloadViaProxy(trimmedUrl, fileName, { taskId: task.id, variant });
      if (!proxied) {
        toast.error(historyT("messages.downloadFailed"));
      }
    },
    [closeDownloadMenu, downloadViaProxy, ensureDownloadAllowed, historyT, resolveDownloadTargets]
  );

  const handleRegenerate = useCallback(
    async (jobId: string) => {
      if (isRegenerating(jobId)) {
        return;
      }

      const original = itemMap.get(jobId);
      if (!original) {
        toast.error(historyT("messages.retryNotFound"));
        return;
      }

      const normalizedStatus = mapStatus(original.latestStatus ?? original.status);
      if (normalizedStatus !== "succeeded") {
        toast.info(historyT("messages.retryInProgress"));
        return;
      }

      let plan: RegenerationPlan;
      try {
        plan = buildRegenerationPlan(original);
      } catch (error) {
        const message = error instanceof Error ? error.message : historyT("messages.retryFailed");
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
          if (response.status === 402 || response.status === 429) {
            openSubscriptionPopup();
          }
          const message = result?.error ?? response.statusText ?? historyT("messages.retryFailed");
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
          toast.info(historyT("messages.retrySubmitted"));
        }

      } catch (error) {
        removeItem(optimistic.jobId);
        const message = error instanceof Error ? error.message : historyT("messages.retryFailed");
        toast.error(message);
      } finally {
        setRegeneratingIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      }
    },
    [itemMap, isRegenerating, upsertItem, removeItem, historyT, openSubscriptionPopup]
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
        const modalityCodes = CATEGORY_MODALITY_MAP[CATEGORY_KEY_MAP[activeCategory]];
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

        const data = (result.data ?? {}) as { items?: CreationItem[]; hasMore?: boolean };
        mergeItems(data.items ?? []);
        setError(null);
        setIsUnauthorized(false);
        setHasMore(Boolean(data.hasMore));
        setPageIndex(page);
      } catch (err: any) {
        if (signal?.aborted) {
          return;
        }
        console.error("[TextToImageRecentTasks] load failed", err);
        if (!appending) {
          setError(err?.message ?? historyT("messages.loadFailed"));
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
            if (!row.job_id) {
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

  useEffect(() => {
    if (!downloadMenuTaskId) {
      return;
    }
    const activeTask = displayTasks.find((task) => task.id === downloadMenuTaskId) ?? null;
    if (!activeTask) {
      setDownloadMenuTaskId(null);
      return;
    }
    const targets = resolveDownloadTargets(activeTask);
    const disabled =
      activeTask.status !== "succeeded" ||
      (!targets.originalUrl && !targets.watermarkUrl);
    if (disabled) {
      setDownloadMenuTaskId(null);
    }
  }, [displayTasks, downloadMenuTaskId, resolveDownloadTargets]);

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
          throw new Error(json?.error ?? historyT("messages.loadFailed"));
        }
        const json = await response.json();
        if (!json?.success || !json?.data) {
          throw new Error(json?.error ?? historyT("messages.loadFailed"));
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
            throw new Error(json?.error ?? historyT("messages.loadFailed"));
          }
          const json = await response.json();
          if (!json?.success || !json?.data) {
            throw new Error(json?.error ?? historyT("messages.loadFailed"));
          }
          const job = json.data as ViewerJob;
          prefetchedJobsRef.current.set(slug, job);
          setViewerJob(job);
        })
        .catch((error: any) => {
          if (controller.signal.aborted) {
            return;
          }
          setViewerError(error?.message ?? historyT("messages.loadFailed"));
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
            alt={previewAlt}
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
        alt={previewAlt}
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
        toast.error(historyT("messages.shareUnavailable"));
        return;
      }

      setTaskToShare(task);
      setShareDialogOpen(true);
    },
    [historyT]
  );

  const handleCopyLink = useCallback(
    async (task: DisplayTask) => {
      if (typeof window === "undefined") {
        return;
      }

      if (!task.shareSlug) {
        toast.error(historyT("messages.shareUnavailable"));
        return;
      }

      const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
      const shareUrl = `${window.location.origin}${localePrefix}/v/${task.shareSlug}?source=share`;

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success(historyT("messages.linkCopied"));
          return;
        } catch (error) {
          console.error("[history-copy] clipboard failed", error);
        }
      }

      window.prompt(historyT("messages.copyPrompt"), shareUrl);
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
        const message = result?.error ?? response.statusText ?? historyT("messages.deleteFailed");
        throw new Error(message);
      }

      removeItem(taskToDelete.id);
      if (taskToDelete.shareSlug) {
        prefetchedJobsRef.current.delete(taskToDelete.shareSlug);
        previousSucceededSlugsRef.current.delete(taskToDelete.shareSlug);
      }

      setTaskToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : historyT("messages.deleteFailed");
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
      return {
        text: historyT("scroller.processingLabel", {
          processing: generationCounts.processing,
          completed: generationCounts.completed,
          total: generationCounts.total,
        }),
        showSpinner: true,
        ariaLabel: historyT("scroller.processingAria", {
          count: generationCounts.processing,
        }),
      };
    }

    return {
      text: historyT("scroller.completedLabel", {
        completed: generationCounts.completed,
        total: generationCounts.total,
      }),
      showSpinner: false,
      ariaLabel: historyT("scroller.completedAria", {
        completed: generationCounts.completed,
        total: generationCounts.total,
      }),
    };
  }, [generationCounts, historyT]);

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
    const mediaUrl =
      fallbackMediaUrl ||
      "https://cdn.bestmaker.ai/static/placeholders/video-effect-preview.mp4";
    content = (
      <div className="relative flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-black/20 p-4 overflow-hidden">
        <div className="h-full w-full max-h-[780px] max-w-[780px] md:max-h-full md:max-w-full">
          <img
            src={mediaUrl}
            alt={previewAlt}
            className="h-full w-full rounded-lg object-contain"
          />
        </div>
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
        {emptyLabel}
      </div>
    );
  } else {
    content = (
      <div className="relative flex-1 min-h-0">
        <ScrollArea className="h-full" viewportRef={handleViewportRef}>
          <div className="pr-3 space-y-4">
            {displayTasks.map((task) => {
              const downloadTargets = resolveDownloadTargets(task);
              const hasWatermarkTarget = Boolean(downloadTargets.watermarkUrl);
              const hasCleanTarget = Boolean(downloadTargets.originalUrl);
              const downloadDisabled =
                task.status !== "succeeded" || (!hasWatermarkTarget && !hasCleanTarget);
              const downloadMenuOpen = downloadMenuTaskId === task.id;

              return (
                <article
                  key={task.id}
                  className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 space-y-4"
                >
                  <header className="flex items-center gap-3">
                    <div className="flex flex-col flex-1 justify-center gap-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium leading-none text-white">
                            {task.provider}
                          </span>
                          <Badge variant="outline" className="border-white/10 bg-white/10 text-white/80 hover:bg-white/10">
                            {task.typeLabel}
                          </Badge>
                          {!task.effectSlug && (
                            <Badge variant="outline" className="border-white/10 bg-white/5 text-white/60 hover:bg-white/5">
                              {task.modelLabel}
                            </Badge>
                          )}
                          {task.effectSlug && !hideEffectBadge ? (
                            <Badge variant="outline" className="border-pink-500/20 bg-pink-500/10 text-pink-200 hover:bg-pink-500/10">
                              {effectBadgeLabel} · {task.effectTitle ?? task.effectSlug}
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
                          "h-8 w-8 text-white/60 hover:text-white hover:bg-[#dc2e5a]",
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
                            className="h-8 w-8 text-white/60 hover:text-white hover:bg-[#dc2e5a]"
                            aria-label={moreActionsLabel}
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
                            <span>{historyT("actions.copyLink")}</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            className="focus:bg-transparent focus:text-[#dc2e5a] focus:[&_svg]:text-[#dc2e5a]"
                            onSelect={() => {
                              handleRequestDelete(task);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>{historyT("actions.delete")}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </header>

                  <div className="space-y-2">
                    {!task.effectSlug && task.metadataSource !== "lip-sync" && (
                      <>
                        {task.prompt ? (
                          <p className="text-sm text-white/70 leading-relaxed">
                            <span className="text-white">{promptLabel}:</span>{" "}
                            {task.prompt}
                          </p>
                        ) : null}
                        {task.negativePrompt ? (
                          <p className="text-xs text-white/50">
                            <span className="text-white/70">{negativeLabel}:</span>{" "}
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
                          <span className="block h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
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
                            className="h-8 w-8 text-white/60 hover:text-white hover:bg-[#dc2e5a]"
                            aria-label={usePromptLabel}
                            onClick={() => void handleReprompt(task.id)}
                          >
                            <PenSquare className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{usePromptLabel}</TooltipContent>
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
                          aria-label={retryLabel}
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
                      <TooltipContent side="top">{retryLabel}</TooltipContent>
                    </Tooltip>
                    {task.status === "succeeded" && task.media?.kind === "image" ? (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/60 hover:text-white hover:bg-[#dc2e5a]"
                              aria-label={imageToImageLabel}
                              onClick={() => void handleStartImageToImage(task)}
                            >
                              <ImageUp className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">{imageToImageLabel}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/60 hover:text-white hover:bg-[#dc2e5a]"
                              aria-label={imageToVideoLabel}
                              onClick={() => void handleStartImageToVideo(task)}
                            >
                              <Clapperboard className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">{imageToVideoLabel}</TooltipContent>
                        </Tooltip>
                      </>
                    ) : null}
                    <DropdownMenu
                      modal={false}
                      open={!downloadDisabled && downloadMenuOpen}
                      onOpenChange={(isOpen) => {
                        if (isOpen) {
                          openDownloadMenu(task.id, downloadDisabled);
                        } else {
                          closeDownloadMenu(task.id);
                        }
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/60 hover:text-white hover:bg-[#dc2e5a]"
                          aria-label={downloadActionLabel}
                          aria-haspopup="menu"
                          aria-expanded={downloadMenuOpen}
                          disabled={downloadDisabled}
                          onMouseEnter={() => openDownloadMenu(task.id, downloadDisabled)}
                          onFocus={() => openDownloadMenu(task.id, downloadDisabled)}
                          onMouseLeave={() => scheduleDownloadMenuClose(task.id)}
                          onBlur={() => scheduleDownloadMenuClose(task.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="top"
                        align="center"
                        sideOffset={12}
                        className="w-48 rounded-2xl border border-white/10 bg-[#1c1c1a] px-2 py-1 text-white/80 shadow-[0_12px_30px_rgba(0,0,0,0.4)]"
                        onMouseEnter={clearDownloadMenuCloseTimeout}
                        onMouseLeave={() => scheduleDownloadMenuClose(task.id)}
                        onFocusCapture={clearDownloadMenuCloseTimeout}
                        onCloseAutoFocus={(event) => {
                          event.preventDefault();
                        }}
                      >
                        <DropdownMenuItem
                          disabled={!hasWatermarkTarget}
                          onSelect={(event) => {
                            event.preventDefault();
                            void handleDownloadOptionClick(task, "watermark");
                          }}
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs focus:bg-white/10 focus:text-[#dc2e5a] hover:text-[#dc2e5a] data-[highlighted]:text-[#dc2e5a]",
                            hasWatermarkTarget ? "cursor-pointer text-white/80" : "text-white/40"
                          )}
                        >
                          <Download className="h-4 w-4 text-inherit" />
                          <span className="flex-1">{downloadWatermarkLabel}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!hasCleanTarget}
                          onSelect={(event) => {
                            event.preventDefault();
                            void handleDownloadOptionClick(task, "clean");
                          }}
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs focus:bg-white/10 focus:text-[#dc2e5a] hover:text-[#dc2e5a] data-[highlighted]:text-[#dc2e5a]",
                            hasCleanTarget ? "cursor-pointer text-white/80" : "text-white/40"
                          )}
                        >
                          <Download className="h-4 w-4 text-inherit" />
                          <span className="flex-1">{downloadCleanLabel}</span>
                          <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#dc2e5a]/20">
                            <Crown className="h-3 w-3 text-[#ffba49]" />
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/60 hover:text-white hover:bg-[#dc2e5a]"
                      aria-label={historyT("actions.share")}
                      disabled={task.status !== "succeeded" || !task.shareSlug}
                      onClick={() => handleShare(task)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    {isRegenerating(task.id) ? (
                      <span className="ml-2 text-white/60">{generatingLabel}</span>
                    ) : null}
                  </footer>
                </article>
              );
            })}
            <div
              ref={loadMoreRef}
              className="py-4 text-center text-xs text-white/50"
            >
              {hasMore
                ? isLoadingMore
                  ? loadingLabel
                  : loadMoreLabel
                : noMoreLabel}
            </div>
          </div>
        </ScrollArea>
        {showScrollTop ? (
          <Button
            variant="secondary"
            className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white hover:bg-white/25"
            onClick={scrollToTop}
            aria-label={generationIndicator?.ariaLabel ?? historyT("scroller.backToTop")}
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

  const categorySelector = shouldShowCategoryFilter ? (
    <div className="mb-4 flex flex-col gap-3 text-xs">
      <div
        className="hidden flex-wrap gap-2 md:flex"
        role="tablist"
        aria-label={categoryFilterLabel}
      >
        {normalizedCategories.map((category) => {
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              className={cn(
                "rounded-full border px-3 py-1 font-medium transition-colors",
                isActive
                  ? "border-white bg-white text-black shadow-sm"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/15"
              )}
              aria-pressed={isActive}
              onClick={() => handleCategoryChange(category)}
            >
              {getCategoryLabel(category)}
            </button>
          );
        })}
      </div>
      <div className="md:hidden">
        <Select
          value={activeCategory}
          onValueChange={(value) => handleCategoryChange(value as CategoryFilter)}
        >
          <SelectTrigger
            aria-label={categoryFilterLabel}
            className="w-full rounded-full border border-white/15 bg-white/5 text-left font-medium text-white focus:ring-0 focus:ring-offset-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border border-white/10 bg-[#1c1c1a] text-xs text-white shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
            {normalizedCategories.map((category) => (
              <SelectItem
                key={category}
                value={category}
                className="text-white/70 focus:text-white data-[state=checked]:text-white"
              >
                {getCategoryLabel(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  ) : (
    <div className="mt-2 mb-4" />
  );

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col text-white">
        {categorySelector}
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
                {loadingLabel}
              </div>
            ) : viewerError ? (
              <div className="flex h-[60vh] w-full items-center justify-center text-white/60">
                {viewerError}
              </div>
            ) : viewerJob ? (
              <ViewerBoard
                job={viewerJob}
                shareUrl={`${typeof window !== "undefined" ? window.location.origin : siteConfig.url}${localePrefix}/v/${viewerJob.shareSlug ?? viewerJob.id}?source=share`}
              />
            ) : (
              <div className="flex h-[40vh] w-full items-center justify-center text-white/60">
                {historyT("viewer.empty")}
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
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          shareUrl={
            taskToShare?.shareSlug
              ? `${typeof window !== "undefined" ? window.location.origin : ""}${locale === DEFAULT_LOCALE ? "" : `/${locale}`
              }/v/${taskToShare.shareSlug}?source=share`
              : ""
          }
          title="Create Realistic/Imaginary HD Videos or Image | BestMaker Ai"
        />
      </div>
    </TooltipProvider>
  );
}
