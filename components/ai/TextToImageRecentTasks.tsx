"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import dayjs from "dayjs";
import Image from "next/image";

import { getUserCreationsHistory } from "@/actions/creations";
import { CreationItem } from "@/lib/ai/creations";
import { getTextToImageModelConfig } from "@/lib/ai/text-to-image-config";
import { getVideoModelConfig } from "@/lib/ai/video-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertTriangle, Download, Heart, MoreHorizontal, RefreshCcw, Share2 } from "lucide-react";

const CATEGORY_OPTIONS = [
  { key: "全部" as const, label: "全部" },
  { key: "视频" as const, label: "视频" },
  { key: "AI视频特效" as const, label: "AI视频特效" },
  { key: "图片" as const, label: "图片" },
];

type CategoryFilter = (typeof CATEGORY_OPTIONS)[number]["key"];

type TaskStatus = "failed" | "succeeded" | "processing";

type TaskMedia =
  | { kind: "image"; url?: string | null; thumbUrl?: string | null }
  | { kind: "video"; url?: string | null; thumbUrl?: string | null }
  | { kind: "unknown"; url?: string | null; thumbUrl?: string | null };

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
};

const CATEGORY_MODALITY_MAP: Record<CategoryFilter, readonly string[] | undefined> = {
  全部: undefined,
  视频: ["t2v"],
  "AI视频特效": ["i2v"],
  图片: ["t2i", "i2i"],
};

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  freepik: "Pollo.ai",
};

const MODALITY_LABELS: Record<string, string> = {
  t2i: "Text to Image",
  i2i: "Image to Image",
  t2v: "Text to Video",
  i2v: "Image to Video",
};

const PAGE_SIZE = 10;

function formatProviderName(code?: string | null) {
  if (!code) {
    return "Unknown";
  }
  return PROVIDER_DISPLAY_NAMES[code] ?? code.replace(/^[a-z]/, (c) => c.toUpperCase());
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
    return { kind: "image", url: imageOutput.url, thumbUrl: imageOutput.thumbUrl };
  }

  const videoOutput = outputs.find((output) =>
    (output.type ?? "").toLowerCase().startsWith("video")
  );
  if (videoOutput && (videoOutput.url || videoOutput.thumbUrl)) {
    return { kind: "video", url: videoOutput.url, thumbUrl: videoOutput.thumbUrl };
  }

  const fallback = outputs[0];
  if (fallback.url || fallback.thumbUrl) {
    return { kind: "unknown", url: fallback.url, thumbUrl: fallback.thumbUrl };
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

function toDisplayTask(job: CreationItem): DisplayTask {
  return {
    id: job.jobId,
    provider: formatProviderName(job.providerCode),
    modalityCode: getModality(job),
    typeLabel: getTypeLabel(job),
    modelLabel: getModelLabel(job),
    createdAtLabel: dayjs(job.createdAt).format("MM-DD HH:mm"),
    prompt: parsePrompt(job.inputParams?.prompt),
    negativePrompt: parsePrompt(job.inputParams?.negative_prompt) || undefined,
    status: mapStatus(job.status),
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
  };
}

export default function TextToImageRecentTasks() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("全部");
  const [items, setItems] = useState<CreationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setIsUnauthorized(false);

      try {
        const modalityCodes = CATEGORY_MODALITY_MAP[activeCategory];
        const result = await getUserCreationsHistory({
          pageIndex: 0,
          pageSize: PAGE_SIZE,
          modalityCodes: modalityCodes ? [...modalityCodes] : undefined,
        });

        if (cancelled) {
          return;
        }

        if (!result.success) {
          const message = result.error ?? "Failed to load history";
          if (/unauthorized|authentication/i.test(message)) {
            setIsUnauthorized(true);
            setItems([]);
          } else {
            setError(message);
          }
          return;
        }

        setItems(result.data?.items ?? []);
      } catch (err: any) {
        if (cancelled) {
          return;
        }
        console.error("[TextToImageRecentTasks] load failed", err);
        setError(err?.message ?? "加载失败，请稍后再试");
        setItems([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const displayTasks = useMemo(() => items.map(toDisplayTask), [items]);

  const renderMedia = (task: DisplayTask) => {
    if (!task.media) {
      return null;
    }

    if (task.media.kind === "video") {
      if (task.media.url) {
        return (
          <div className="w-full max-w-[260px]">
            <video
              src={task.media.url}
              poster={task.media.thumbUrl ?? undefined}
              className="w-full h-auto rounded-lg border border-white/10 bg-black/40"
              controls
              preload="metadata"
            />
          </div>
        );
      }
      if (task.media.thumbUrl) {
        return (
          <div className="w-full max-w-[260px]">
            <Image
              src={task.media.thumbUrl}
              alt="Video preview"
              width={720}
              height={405}
              className="w-full h-auto rounded-lg border border-white/10 object-cover"
              unoptimized
            />
          </div>
        );
      }
      return null;
    }

    const imageSrc = task.media.url ?? task.media.thumbUrl;
    if (!imageSrc) {
      return null;
    }

    return (
      <div className="w-full max-w-[260px]">
        <Image
          src={imageSrc}
          alt="生成结果"
          width={512}
          height={512}
          className="w-full h-auto rounded-lg border border-white/10 object-cover"
          unoptimized
        />
      </div>
    );
  };

  let content: ReactNode = null;

  if (isLoading) {
    content = (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 space-y-4"
          >
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
        ))}
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
      <ScrollArea className="flex-1 min-h-0">
        <div className="pr-3 space-y-4">
          {displayTasks.map((task) => (
            <article
              key={task.id}
              className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 space-y-4"
            >
              <header className="flex items-start gap-3">
                <Avatar className="h-8 w-8 border border-white/10 bg-white/10 text-white">
                  <AvatarFallback className="text-xs font-semibold bg-transparent text-white">
                    {task.provider.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium leading-none text-white">
                        {task.provider}
                      </span>
                      <Badge className="border-white/10 bg-white/10 text-white/80">
                        {task.typeLabel}
                      </Badge>
                      <Badge className="border-white/10 bg-white/5 text-white/60">
                        {task.modelLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      {task.aspectRatio ? <span>{task.aspectRatio}</span> : null}
                      {typeof task.seed === "number" ? <span>Seed {task.seed}</span> : null}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                    aria-label="More actions"
                    disabled
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </header>

              <div className="space-y-2">
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  aria-label="Retry generation"
                  disabled={task.status !== "failed"}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
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
                  disabled={task.status !== "succeeded" || !task.media || !task.media.url}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <span className="ml-2">
                  {task.status === "failed"
                    ? "Retry available soon"
                    : task.status === "processing"
                    ? "Processing..."
                    : "Ready to download"}
                </span>
              </footer>
            </article>
          ))}
        </div>
      </ScrollArea>
    );
  }

  return (
    <div className="h-full flex flex-col text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 pt-1">
        <Select
          value={activeCategory}
          onValueChange={(value) => setActiveCategory(value as CategoryFilter)}
        >
          <SelectTrigger className="w-[160px] bg-white/5 border border-white/10 text-white/80 focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent className="bg-[#1C1B1A] text-white border border-white/10">
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center text-sm text-white/70" />
      </div>
      {content}
    </div>
  );
}
