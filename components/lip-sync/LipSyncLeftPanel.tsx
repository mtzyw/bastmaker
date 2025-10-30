"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Upload, Trash2, Loader2, Video as VideoIcon, Music2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCreationHistoryStore } from "@/stores/creationHistoryStore";
import type { CreationItem } from "@/lib/ai/creations";
import { DEFAULT_LIP_SYNC_MODEL, getLipSyncModelConfig } from "@/lib/ai/lip-sync-config";

type UploadKind = "video" | "audio";

type UploadedAsset = {
  file: File;
  previewUrl: string | null;
  remoteUrl: string | null;
  uploading: boolean;
  error: string | null;
  key: string | null;
  contentType: string | null;
  size: number;
};

type UploadResponse = {
  url: string;
  key?: string | null;
  contentType?: string | null;
  size?: number | null;
};

export default function LipSyncLeftPanel() {
  const [video, setVideo] = useState<UploadedAsset | null>(null);
  const [audio, setAudio] = useState<UploadedAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const modelConfig = useMemo(
    () => getLipSyncModelConfig(DEFAULT_LIP_SYNC_MODEL),
    [],
  );

  const upsertHistoryItem = useCreationHistoryStore((state) => state.upsertItem);
  const removeHistoryItem = useCreationHistoryStore((state) => state.removeItem);

  const uploadLipSyncFile = useCallback(async (file: File, kind: UploadKind): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const response = await fetch("/api/uploads/lip-sync", {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result?.success) {
      const message =
        typeof result?.error === "string" ? result.error : "文件上传失败";
      throw new Error(message);
    }

    const url = result?.data?.url;
    const key = result?.data?.key;

    if (typeof url !== "string" || url.length === 0) {
      throw new Error("上传返回结果异常");
    }

    return {
      url,
      key: typeof key === "string" ? key : null,
      contentType: result?.data?.contentType ?? null,
      size: result?.data?.size ?? null,
    };
  }, []);

  const handleFileSelect = useCallback(
    async (file: File, kind: UploadKind) => {
      const previewUrl = kind === "video" ? URL.createObjectURL(file) : null;
      const asset: UploadedAsset = {
        file,
        previewUrl,
        remoteUrl: null,
        uploading: true,
        error: null,
        key: null,
        contentType: file.type || null,
        size: file.size,
      };

      if (kind === "video") {
        if (video?.previewUrl) URL.revokeObjectURL(video.previewUrl);
        setVideo(asset);
      } else {
        setAudio((current) => {
          if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
          return asset;
        });
      }

      try {
        const result = await uploadLipSyncFile(file, kind);
        if (kind === "video") {
          setVideo((current) =>
            current && current.file === file
              ? {
                  ...current,
                  remoteUrl: result.url,
                  uploading: false,
                  key: result.key ?? null,
                  contentType: result.contentType ?? current.contentType,
                  size: typeof result.size === "number" ? result.size : current.size,
                }
              : current,
          );
        } else {
          setAudio((current) =>
            current && current.file === file
              ? {
                  ...current,
                  remoteUrl: result.url,
                  uploading: false,
                  key: result.key ?? null,
                  contentType: result.contentType ?? current.contentType,
                  size: typeof result.size === "number" ? result.size : current.size,
                }
              : current,
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "文件上传失败，请稍后重试";
        toast.error(message);
        if (kind === "video") {
          setVideo((current) =>
            current && current.file === file
              ? { ...current, uploading: false, error: message }
              : current,
          );
        } else {
          setAudio((current) =>
            current && current.file === file
              ? { ...current, uploading: false, error: message }
              : current,
          );
        }
      }
    },
    [audio, uploadLipSyncFile, video],
  );

  const handleClear = useCallback((kind: UploadKind) => {
    if (kind === "video") {
      if (video?.previewUrl) URL.revokeObjectURL(video.previewUrl);
      setVideo(null);
    } else {
      if (audio?.previewUrl) URL.revokeObjectURL(audio.previewUrl);
      setAudio(null);
    }
  }, [audio?.previewUrl, video?.previewUrl]);

  const buildHistoryItem = useCallback(
    ({
      jobId,
      status,
      latestStatus,
      providerJobId,
      createdAt,
      costCredits,
    }: {
      jobId: string;
      status: string;
      latestStatus?: string | null;
      providerJobId?: string | null;
      createdAt: string;
      costCredits?: number;
    }): CreationItem => {
      const effectiveStatus = status || "processing";
      const effectiveLatest = latestStatus ?? effectiveStatus;
      const credits = typeof costCredits === "number" ? costCredits : modelConfig.creditsCost;
      const videoUrl = video?.remoteUrl ?? null;
      const audioUrl = audio?.remoteUrl ?? null;

      return {
        jobId,
        providerCode: modelConfig.providerCode,
        providerJobId: providerJobId ?? null,
        status: effectiveStatus,
        latestStatus: effectiveLatest,
        createdAt,
        costCredits: credits,
        outputs: [],
        metadata: {
          source: "lip-sync",
          credits_cost: credits,
          video_url: videoUrl,
          audio_url: audioUrl,
          freepik_latest_status: effectiveLatest,
          freepik_initial_status: effectiveStatus,
          model_display_name: modelConfig.displayName,
        },
        inputParams: {
          model: DEFAULT_LIP_SYNC_MODEL,
          video_url: videoUrl,
          audio_url: audioUrl,
        },
        modalityCode: modelConfig.defaultModality,
        modelSlug: DEFAULT_LIP_SYNC_MODEL,
        errorMessage: null,
        seed: null,
        isImageToImage: false,
        referenceImageCount: 0,
        shareSlug: null,
        shareVisitCount: 0,
        shareConversionCount: 0,
        publicTitle: null,
        publicSummary: null,
      };
    },
    [audio?.remoteUrl, modelConfig, video?.remoteUrl],
  );

  const handleSubmit = useCallback(async () => {
    if (!video?.remoteUrl || !audio?.remoteUrl) {
      const pending = video?.uploading || audio?.uploading;
      if (pending) {
        toast.info("文件正在上传，请稍候");
      } else {
        toast.error("请先上传视频与音频文件");
      }
      return;
    }

    if (video.error || audio.error) {
      toast.error("文件上传失败，请重新上传后再试");
      return;
    }

    const optimisticCreatedAt = new Date().toISOString();
    const tempJobId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `temp-${crypto.randomUUID()}`
        : `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const optimisticItem = buildHistoryItem({
      jobId: tempJobId,
      status: "processing",
      latestStatus: "processing",
      createdAt: optimisticCreatedAt,
    });

    upsertHistoryItem(optimisticItem);
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/ai/freepik/lip-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: video.remoteUrl,
          audio_url: audio.remoteUrl,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.success) {
        const message =
          typeof result?.error === "string"
            ? result.error
            : "对口型任务提交失败，请稍后重试";
        throw new Error(message);
      }

      const payload = result.data as {
        jobId?: string;
        providerJobId?: string | null;
        status?: string;
        freepikStatus?: string | null;
        creditsCost?: number;
        updatedBenefits?: { totalAvailableCredits?: number };
      };

      removeHistoryItem(tempJobId);

      if (payload?.jobId) {
        const latestStatus = payload.freepikStatus ?? payload.status ?? "processing";
        const item = buildHistoryItem({
          jobId: payload.jobId,
          status: payload.status ?? "processing",
          latestStatus,
          providerJobId: payload.providerJobId ?? null,
          createdAt: optimisticCreatedAt,
          costCredits: payload.creditsCost,
        });
        upsertHistoryItem(item);
      }

      const credits = payload?.creditsCost;
      const remaining = payload?.updatedBenefits?.totalAvailableCredits;
      const parts: string[] = [];
      if (typeof credits === "number") {
        parts.push(`本次扣除 ${credits} Credits`);
      }
      if (typeof remaining === "number") {
        parts.push(`当前余额 ${remaining} Credits`);
      }
      if (parts.length > 0) {
        setStatusMessage(parts.join("，"));
      } else {
        setStatusMessage(null);
      }

      toast.success("对口型任务已提交");
    } catch (error) {
      removeHistoryItem(tempJobId);
      const message =
        error instanceof Error ? error.message : "对口型任务提交失败，请稍后重试";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [audio, buildHistoryItem, removeHistoryItem, upsertHistoryItem, video]);

  useEffect(() => {
    return () => {
      if (video?.previewUrl) URL.revokeObjectURL(video.previewUrl);
      if (audio?.previewUrl) URL.revokeObjectURL(audio.previewUrl);
    };
  }, [audio?.previewUrl, video?.previewUrl]);

  return (
    <div className="w-full h-full min-h-0 text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]">
        <div className="pr-1 md:pr-7">
          <h1 className="text-2xl font-semibold mt-2 mb-4 h-11 flex items-center">
            对口型
          </h1>

          <div className="space-y-4">
            <UploadSection
              title="上传视频"
              description="支持 mp4、mov、webm 等常见格式，建议时长 15-60 秒。"
              placeholder="拖拽视频到此处或点击上传"
              kind="video"
              asset={video}
              icon={<VideoIcon className="w-6 h-6 text-white/70" />}
              showPreview
              onPick={() => videoInputRef.current?.click()}
              onClear={() => handleClear("video")}
            />
            <UploadSection
              title="上传音频"
              description="支持 mp3、wav、aac 等格式，系统将根据音频进行口型匹配。"
              placeholder="拖拽音频到此处或点击上传"
              kind="audio"
              asset={audio}
              icon={<Music2 className="w-6 h-6 text-white/70" />}
              onPick={() => audioInputRef.current?.click()}
              onClear={() => handleClear("audio")}
            />
          </div>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFileSelect(file, "video");
              event.target.value = "";
            }}
          />

          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFileSelect(file, "audio");
              event.target.value = "";
            }}
          />
        </div>
      </ScrollArea>

      <div className="pt-2 pb-0 shrink-0 border-t border-white/10 -mx-4 md:-mx-6">
        <div className="px-4 md:px-6 space-y-3">
          <Button
            className={cn(
              "w-full h-12 text-white transition-colors bg-gray-900 disabled:bg-gray-900 disabled:text-white/50 disabled:opacity-100",
              video?.remoteUrl &&
                audio?.remoteUrl &&
                !video?.uploading &&
                !audio?.uploading &&
                "bg-[#dc2e5a] hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]",
              isSubmitting && "cursor-wait",
            )}
            disabled={
              !video?.remoteUrl ||
              !audio?.remoteUrl ||
              video.uploading ||
              audio.uploading ||
              isSubmitting
            }
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : (
              "开始对口型"
            )}
          </Button>
          {statusMessage ? (
            <p className="text-sm text-white/70">{statusMessage}</p>
          ) : null}
        </div>
        <div className="mt-6 border-t border-white/10" />
      </div>
    </div>
  );
}

type UploadSectionProps = {
  title: string;
  description: string;
  placeholder: string;
  kind: UploadKind;
  icon: ReactNode;
  asset: UploadedAsset | null;
  onPick: () => void;
  onClear: () => void;
  showPreview?: boolean;
};

function UploadSection({
  title,
  description,
  placeholder,
  kind,
  icon,
  asset,
  onPick,
  onClear,
  showPreview,
}: UploadSectionProps) {
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    setIsVideoReady(false);
  }, [asset?.remoteUrl, asset?.previewUrl, asset?.uploading]);

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-medium text-white/80">{title}</h2>
        <p className="text-xs text-white/50 mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={onPick}
        className={cn(
          "group w-full overflow-hidden rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors text-left",
          "px-4 py-4",
        )}
      >
        <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40">
          {showPreview && asset?.remoteUrl && !asset.uploading && !asset.error && kind === "video" ? (
            <video
              src={asset.remoteUrl}
              className="h-full w-full object-contain"
              autoPlay
              muted
              loop
              playsInline
              onLoadedData={() => setIsVideoReady(true)}
              onLoadStart={() => setIsVideoReady(false)}
            />
          ) : asset?.previewUrl && kind === "video" ? (
            <video
              src={asset.previewUrl}
              className="h-full w-full object-contain"
              autoPlay
              muted
              loop
              playsInline
              onLoadedData={() => setIsVideoReady(true)}
              onLoadStart={() => setIsVideoReady(false)}
            />
          ) : asset && kind === "audio" ? (
            <div className="flex flex-col items-center gap-2 text-white/70">
              <Music2 className="h-8 w-8" />
              <span className="text-xs">{asset.file.name}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/60">
              {icon}
              <p className="text-sm text-center">{placeholder}</p>
            </div>
          )}
          {asset && !asset.uploading && !asset.error ? (
            <div
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onClear();
                }
              }}
            >
              <Trash2 className="h-5 w-5" />
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-xs text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
              点击上传
            </div>
          )}
          {asset?.uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#dc2e5a] border-t-transparent" />
            </div>
          ) : null}
          {kind === "video" && asset && !asset.uploading && !asset.error && !isVideoReady ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#dc2e5a] border-t-transparent" />
            </div>
          ) : null}
        </div>
      </button>
    </section>
  );
}
