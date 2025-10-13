"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Link } from "@/i18n/routing";
import type { VideoEffectTemplate } from "@/lib/video-effects/templates";
import type { CreationItem } from "@/lib/ai/creations";
import { useCreationHistoryStore } from "@/stores/creationHistoryStore";
import { toast } from "sonner";
import { ChevronRight, Coins, Crown, Upload } from "lucide-react";

type ToggleOption = {
  id: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
  premium?: boolean;
};

const TOGGLE_OPTIONS: readonly ToggleOption[] = [
  {
    id: "public",
    label: "公开可见性",
    description: "允许特效出现在探索页与推荐位。",
    defaultChecked: true,
  },
  {
    id: "protect",
    label: "复制保护",
    description: "防止他人直接克隆我的特效项目。",
    premium: true,
  },
];

const DEFAULT_PREVIEW_VIDEO =
  "https://cdn.bestmaker.ai/tasks/10a81006-480e-4ccf-ba60-c9887e2be6f8/0.mp4";

type LocalAsset = {
  file: File;
  remoteUrl: string | null;
  previewUrl: string;
};

export function VideoEffectsEditorLeftPanel({ effect }: { effect: VideoEffectTemplate }) {
  const previewSrc = effect.previewVideoUrl ?? DEFAULT_PREVIEW_VIDEO;
  const pricing = effect.pricingCreditsOverride ?? 10;
  const upsertHistoryItem = useCreationHistoryStore((state) => state.upsertItem);
  const removeHistoryItem = useCreationHistoryStore((state) => state.removeItem);
  const [localAsset, setLocalAsset] = useState<LocalAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (localAsset?.previewUrl) {
        URL.revokeObjectURL(localAsset.previewUrl);
      }
    };
  }, [localAsset?.previewUrl]);

  const uploadImageToR2 = useCallback(async (file: File, kind: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const response = await fetch("/api/uploads/image-to-video", {
      method: "POST",
      body: formData,
    });
    const json = await response.json();
    if (!response.ok || !json?.success) {
      const message = typeof json?.error === "string" ? json.error : "上传失败，请稍后重试";
      throw new Error(message);
    }
    const url = json?.data?.url;
    if (typeof url !== "string" || url.length === 0) {
      throw new Error("上传结果异常，请重新选择素材");
    }
    return url;
  }, []);

  const handleSelectFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        return;
      }

      if (localAsset?.previewUrl) {
        URL.revokeObjectURL(localAsset.previewUrl);
      }

      const previewUrl = URL.createObjectURL(file);
      setLocalAsset({ file, remoteUrl: null, previewUrl });
      setIsUploading(true);
      try {
        const remoteUrl = await uploadImageToR2(file, "primary");
        setLocalAsset((current) => {
          if (!current || current.file !== file) {
            return current;
          }
          return { ...current, remoteUrl };
        });
      } catch (error: any) {
        const message = error instanceof Error ? error.message : "上传失败，请稍后再试";
        toast.error(message, { duration: 6000 });
        setLocalAsset(null);
      } finally {
        setIsUploading(false);
      }
    },
    [localAsset?.previewUrl, uploadImageToR2]
  );

  const handleCreate = useCallback(async () => {
    if (isSubmitting) {
      return;
    }
    if (!localAsset?.remoteUrl) {
      toast.warning("请先上传素材");
      return;
    }

    const payload: Record<string, unknown> = {
      effect_slug: effect.slug,
      assets: {
        primary: {
          url: localAsset.remoteUrl,
        },
      },
    };

    setIsSubmitting(true);
    setStatusMessage(null);

    const optimisticCreatedAt = new Date().toISOString();
    const tempJobId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `temp-${crypto.randomUUID()}`
        : `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const modality = effect.modalityCode ?? "i2v";
    const source = modality === "i2v" || modality === "t2v" ? "video" : "image";

    const optimisticItem: CreationItem = {
      jobId: tempJobId,
      providerCode: effect.providerCode,
      providerJobId: null,
      status: "processing",
      latestStatus: "processing",
      createdAt: optimisticCreatedAt,
      costCredits: pricing,
      outputs: [],
      metadata: {
        source,
        effect_slug: effect.slug,
        effect_title: effect.title,
        modality_code: modality,
        reference_inputs: { primary: true },
        reference_image_count: 1,
        reference_image_urls: [localAsset.remoteUrl],
        credits_cost: pricing,
        freepik_initial_status: "processing",
        freepik_latest_status: "processing",
      },
      inputParams: {
        effect_slug: effect.slug,
        provider_model: effect.providerModel,
      },
      modalityCode: modality,
      modelSlug: effect.providerModel,
      errorMessage: null,
      seed: effect.seed ? String(effect.seed) : null,
      isImageToImage: modality === "i2i",
      referenceImageCount: 1,
      shareSlug: null,
      shareVisitCount: 0,
      shareConversionCount: 0,
      publicTitle: null,
      publicSummary: null,
    };

    upsertHistoryItem(optimisticItem);

    try {
      const response = await fetch("/api/ai/freepik/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.success) {
        const message = json?.error ?? response.statusText ?? "提交失败，请稍后再试";
        throw new Error(message);
      }

      removeHistoryItem(tempJobId);

      const taskInfo = json.data as {
        jobId?: string;
        status?: string;
        freepikStatus?: string;
        providerJobId?: string;
        creditsCost?: number;
      };

      if (taskInfo?.jobId) {
        upsertHistoryItem({
          ...optimisticItem,
          jobId: taskInfo.jobId,
          status: taskInfo.status ?? "processing",
          latestStatus: taskInfo.freepikStatus ?? taskInfo.status ?? "processing",
          providerJobId: taskInfo.providerJobId ?? null,
          createdAt: optimisticCreatedAt,
          costCredits:
            typeof taskInfo.creditsCost === "number" ? taskInfo.creditsCost : pricing,
        });
      }

      setStatusMessage("任务已提交，稍后请在右侧记录查看进度。");
    } catch (error: any) {
      removeHistoryItem(tempJobId);
      const message = error instanceof Error ? error.message : "提交失败，请稍后再试";
      toast.error(message, { duration: 6000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [effect, isSubmitting, localAsset, pricing, removeHistoryItem, upsertHistoryItem]);

  return (
    <div className="flex h-full w-full flex-col text-white">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]" scrollbarClassName="!right-0">
        <div className="flex flex-col gap-6 pt-3 pb-16 pr-2 md:pr-7">
          <div className="space-y-3">
            <Link
              href="/video-effects"
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-white/50 transition hover:text-white"
            >
              返回列表
            </Link>
            <div>
              {effect.category ? <p className="text-sm text-white/60">{effect.category}</p> : null}
              <h1 className="mt-1 text-3xl font-semibold text-white md:text-4xl">
                {effect.title}
              </h1>
              {effect.description ? (
                <p className="mt-3 text-sm leading-relaxed text-white/70">{effect.description}</p>
              ) : null}
            </div>
          </div>

          <section className="space-y-3">
            <header className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/90">特效模板</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-blue-300 transition hover:text-blue-200"
              >
                更换
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <video
                className="aspect-video w-full object-cover"
                src={previewSrc}
                muted
                loop
                playsInline
                autoPlay
              />
              <div className="pointer-events-none absolute inset-0 border border-white/10" />
            </div>
          </section>

          <section>
            <div
              className="relative flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/20 bg-black/40 px-6 py-12 text-center text-sm text-white/60"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0] ?? null;
                if (file) {
                  void handleSelectFile(file);
                }
              }}
            >
              {localAsset ? (
                <div className="relative w-full max-w-sm overflow-hidden rounded-lg border border-white/15">
                  {localAsset.previewUrl.endsWith(".mp4") ? (
                    <video
                      src={localAsset.previewUrl}
                      className="w-full object-cover"
                      muted
                      loop
                      autoPlay
                    />
                  ) : (
                    <Image
                      src={localAsset.previewUrl}
                      alt="上传预览"
                      width={512}
                      height={512}
                      className="w-full object-cover"
                    />
                  )}
                  {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white/70">
                      上传中…
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-7 w-7 text-white/40" />
                  <p>点击、拖拽或粘贴素材</p>
                  <p className="text-xs text-white/40">支持 PNG / JPG / MP4，最大 200MB</p>
                </div>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/10 text-white hover:bg-white/20"
                onClick={(event) => {
                  event.stopPropagation();
                  inputRef.current?.click();
                }}
                disabled={isUploading || isSubmitting}
              >
                {localAsset ? "重新选择" : "选择文件"}
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file) {
                    void handleSelectFile(file);
                  }
                  event.target.value = "";
                }}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              {TOGGLE_OPTIONS.map((toggle) => (
                <div
                  key={toggle.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-black/30 px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{toggle.label}</p>
                      {toggle.premium && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-200">
                          <Crown className="h-3 w-3" />
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/45">{toggle.description}</p>
                  </div>
                  <Switch defaultChecked={toggle.defaultChecked} aria-label={toggle.label} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-white/10 pb-0 pt-2 -mx-4 md:-mx-6">
        <div className="px-4 md:px-6">
          <div className="mb-3">
            <div className="mb-2 text-sm text-white/80">Credits 消耗</div>
            <div className="flex items-center justify-between text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-pink-400" />
                Credits required:
              </div>
              <div>{pricing} Credits</div>
            </div>
          </div>
          <Button
            className="h-12 w-full bg-[#dc2e5a] text-white transition-colors hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]"
            onClick={handleCreate}
            disabled={isSubmitting || isUploading || !localAsset?.remoteUrl}
          >
            创建
          </Button>
          {statusMessage ? <p className="mt-2 text-xs text-white/60">{statusMessage}</p> : null}
        </div>
        <div className="mt-6 border-t border-white/10" />
      </div>
    </div>
  );
}
