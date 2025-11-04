"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Coins, Upload, Trash2 } from "lucide-react";
import type { ImageEffectTemplate } from "@/lib/image-effects/templates";
import type { CreationItem } from "@/lib/ai/creations";
import { useCreationHistoryStore } from "@/stores/creationHistoryStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DEFAULT_PREVIEW_IMAGE =
  "https://cdn.bestmaker.ai/static/placeholders/image-effect-preview.jpg";

type LocalAsset = {
  file: File;
  remoteUrl: string | null;
  previewUrl: string;
};

export function ImageEffectsEditorLeftPanel({ effect }: { effect: ImageEffectTemplate }) {
  const defaultPrompt = useMemo(() => {
    const params = (effect.metadata?.freepik_params ?? {}) as Record<string, any>;
    return typeof params.prompt === "string" && params.prompt.length > 0
      ? params.prompt
      : "高质量人像精修摄影";
  }, [effect.metadata]);

  const defaultAspectRatio = useMemo(() => {
    const params = (effect.metadata?.freepik_params ?? {}) as Record<string, any>;
    return typeof params.aspect_ratio === "string" && params.aspect_ratio.length > 0
      ? params.aspect_ratio
      : "1:1";
  }, [effect.metadata]);

  const upsertHistoryItem = useCreationHistoryStore((state) => state.upsertItem);
  const removeHistoryItem = useCreationHistoryStore((state) => state.removeItem);

  const [prompt, setPrompt] = useState(defaultPrompt);
  const [aspectRatio, setAspectRatio] = useState(defaultAspectRatio);
  const [localAsset, setLocalAsset] = useState<LocalAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPrompt(defaultPrompt);
  }, [defaultPrompt]);

  useEffect(() => {
    setAspectRatio(defaultAspectRatio);
  }, [defaultAspectRatio]);

  useEffect(() => {
    setLocalAsset(null);
    setStatusMessage(null);
    setErrorMessage(null);
    setIsPublic(true);
  }, [effect.id]);

  useEffect(() => {
    return () => {
      if (localAsset?.previewUrl && localAsset.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localAsset.previewUrl);
      }
    };
  }, [localAsset?.previewUrl]);

  const handleSelectFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("仅支持上传图片素材，请选择 PNG/JPG/WebP 格式");
        return;
      }

      if (localAsset?.previewUrl && localAsset.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localAsset.previewUrl);
      }

      const previewUrl = URL.createObjectURL(file);
      setLocalAsset({ file, previewUrl, remoteUrl: null });
      setStatusMessage(null);
      setErrorMessage(null);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/uploads/image-to-image", {
          method: "POST",
          body: formData,
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result?.success) {
          const message =
            typeof result?.error === "string" ? result.error : "图片上传失败，请稍后重试";
          throw new Error(message);
        }

        setLocalAsset((current) => {
          if (!current || current.file !== file) {
            return current;
          }
          return { ...current, remoteUrl: result.data?.url ?? null };
        });
      } catch (error: any) {
        const message =
          error instanceof Error ? error.message : "图片上传失败，请稍后再试";
        toast.error(message);
        setLocalAsset(null);
      } finally {
        setIsUploading(false);
      }
    },
    [localAsset?.previewUrl]
  );

  const creditsCost = effect.pricingCreditsOverride ?? 6;
  const providerReady = Boolean(effect.providerModel);

  const buildHistoryItem = useCallback(
    ({
      jobId,
      status,
      latestStatus,
      providerJobId,
      createdAt,
    }: {
      jobId: string;
      status: string;
      latestStatus?: string | null;
      providerJobId?: string | null;
      createdAt: string;
    }): CreationItem => {
      const primaryImageUrl = localAsset?.remoteUrl ?? localAsset?.previewUrl ?? null;
      const effectiveStatus = status || "processing";
      const effectiveLatest = latestStatus ?? effectiveStatus;

      return {
        jobId,
        providerCode: effect.providerCode,
        providerJobId: providerJobId ?? null,
        status: effectiveStatus,
        latestStatus: effectiveLatest,
        createdAt,
        costCredits: creditsCost,
        outputs: [],
        metadata: {
          source: "image-effect",
          effect_slug: effect.slug,
          effect_title: effect.title,
          credits_cost: creditsCost,
          prompt,
          aspect_ratio: aspectRatio,
          reference_inputs: { primary: true },
          reference_image_urls: primaryImageUrl ? [primaryImageUrl] : [],
          reference_image_count: primaryImageUrl ? 1 : 0,
          primary_image_url: primaryImageUrl,
          freepik_initial_status: effectiveStatus,
          freepik_latest_status: effectiveLatest,
          is_public: isPublic,
        },
        inputParams: {
          effect_slug: effect.slug,
          prompt,
          aspect_ratio: aspectRatio,
          translate_prompt: false,
          reference_image_urls: primaryImageUrl ? [primaryImageUrl] : [],
          primary_image_url: primaryImageUrl,
          provider_model: effect.providerModel,
          is_public: isPublic,
        },
        modalityCode: "i2i",
        modelSlug: effect.providerModel,
        errorMessage: null,
        seed: null,
        isImageToImage: true,
        referenceImageCount: primaryImageUrl ? 1 : 0,
        shareSlug: null,
        shareVisitCount: 0,
        shareConversionCount: 0,
        publicTitle: null,
        publicSummary: null,
      };
    },
    [aspectRatio, effect.providerCode, effect.providerModel, effect.slug, effect.title, isPublic, localAsset?.previewUrl, localAsset?.remoteUrl, prompt, creditsCost]
  );

  const handleCreate = useCallback(async () => {
    if (!providerReady) {
      toast.error("当前模板尚未配置 Provider Model，请在后台完善后再试。");
      return;
    }

    if (!localAsset?.remoteUrl) {
      toast.error("请先上传参考图片");
      return;
    }

    if (!prompt.trim()) {
      toast.error("提示词不能为空");
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

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

    try {
      const payload = {
        effect_slug: effect.slug,
        assets: {
          primary: {
            url: localAsset.remoteUrl,
          },
        },
        prompt: prompt.trim(),
        aspect_ratio: aspectRatio,
        is_public: isPublic,
      };

      const response = await fetch("/api/ai/effects/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.success) {
        const message =
          result?.error ?? response.statusText ?? "提交失败，请稍后重试";
        throw new Error(message);
      }

      const data = result.data as {
        jobId?: string;
        providerJobId?: string | null;
        status?: string;
        freepikStatus?: string | null;
        creditsCost?: number;
        updatedBenefits?: { totalAvailableCredits?: number };
      };

      removeHistoryItem(tempJobId);

      if (data?.jobId) {
        const latest = data.freepikStatus ?? data.status ?? "processing";
        const persistedItem = buildHistoryItem({
          jobId: data.jobId,
          status: data.status ?? "processing",
          latestStatus: latest,
          providerJobId: data.providerJobId ?? null,
          createdAt: optimisticCreatedAt,
        });
        upsertHistoryItem(persistedItem);
      }

      const parts: string[] = [];
      if (typeof data?.creditsCost === "number") {
        parts.push(`本次扣除 ${data.creditsCost} Credits`);
      }
      const remaining = data?.updatedBenefits?.totalAvailableCredits;
      if (typeof remaining === "number") {
        parts.push(`当前余额 ${remaining} Credits`);
      }
      setStatusMessage(parts.length > 0 ? parts.join("，") : null);
      toast.success("图片特效任务已创建");
    } catch (error: any) {
      removeHistoryItem(tempJobId);
      const message = error instanceof Error ? error.message : "提交失败，请稍后重试";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    aspectRatio,
    buildHistoryItem,
    effect.slug,
    isPublic,
    isSubmitting,
    localAsset?.remoteUrl,
    prompt,
    removeHistoryItem,
    upsertHistoryItem,
  ]);

  const previewImage = effect.previewImageUrl ?? DEFAULT_PREVIEW_IMAGE;

  return (
    <div className="flex h-full min-h-0 flex-col text-white">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]">
        <div className="pr-1 md:pr-7">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">
            AI 图片特效
          </p>
          <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
            {effect.title}
          </h1>
          {effect.description ? (
            <p className="mt-2 text-sm text-white/60">{effect.description}</p>
          ) : null}

          <section className="mt-8 space-y-4">
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-white/80">上传参考图</h2>
              <p className="text-xs text-white/50">
                支持 PNG、JPG、WEBP 格式，建议分辨率大于 1024×1024。
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "group relative flex h-48 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
                )}
              >
                {localAsset?.previewUrl ? (
                  <Image
                    src={localAsset.previewUrl}
                    alt="参考图预览"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <>
                    <Image
                      src={previewImage}
                      alt="模板参考"
                      fill
                      className="object-cover opacity-30"
                    />
                    <div className="relative flex flex-col items-center gap-2 text-xs text-white/70">
                      <Upload className="h-6 w-6 text-white/60" />
                      <span>点击或拖拽上传参考图</span>
                    </div>
                  </>
                )}
                <div className="pointer-events-none absolute inset-0 border border-white/10" />
                {isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white/80">
                    上传中...
                  </div>
                ) : null}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void handleSelectFile(file);
                  event.target.value = "";
                }}
              />
              {localAsset ? (
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span className="truncate">{localAsset.file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/70 hover:text-white"
                    onClick={() => {
                      if (localAsset.previewUrl.startsWith("blob:")) {
                        URL.revokeObjectURL(localAsset.previewUrl);
                      }
                      setLocalAsset(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium text-white/80">提示词</h2>
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                className="min-h-[160px] resize-y bg-white/5 text-white placeholder:text-white/60"
                maxLength={1000}
              />
              <p className="text-xs text-white/50 text-right">{prompt.length} / 1000</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium text-white/80">纵横比</h2>
              <div className="flex flex-wrap gap-2">
                {["1:1", "3:4", "4:5", "9:16", "16:9"].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={cn(
                      "rounded-full border border-white/10 px-3 py-1 text-xs transition",
                      aspectRatio === ratio
                        ? "bg-white text-gray-900"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-white/10 pb-0 pt-2 -mx-4 md:-mx-6">
        <div className="space-y-3 px-4 md:px-6">
          <div className="flex items-center justify-between gap-3 text-sm text-white/80">
            <div className="flex flex-col">
              <span>公开到个人主页</span>
              <span className="text-xs text-white/50">关闭后仅自己可见</span>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <div className="flex items-center justify-between text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-pink-400" />
              Credits required:
            </div>
            <div>{creditsCost} Credits</div>
          </div>
          <Button
            className={cn(
              "h-12 w-full bg-gray-900 text-white transition-colors disabled:bg-gray-900 disabled:text-white/50 disabled:opacity-100",
              prompt.trim() &&
                localAsset?.remoteUrl &&
                "bg-[#dc2e5a] hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]",
              (isSubmitting || isUploading) && "cursor-wait"
            )}
            disabled={
              !providerReady ||
              !prompt.trim() ||
              !localAsset?.remoteUrl ||
              isSubmitting ||
              isUploading
            }
            onClick={() => void handleCreate()}
          >
            {providerReady ? (isSubmitting ? "生成中..." : "创建图片特效") : "模板未配置"}
          </Button>
          {statusMessage ? (
            <p className="text-xs text-white/60">{statusMessage}</p>
          ) : null}
          {errorMessage ? (
            <p className="text-xs text-red-400">{errorMessage}</p>
          ) : null}
        </div>
        <div className="mt-6 border-t border-white/10" />
      </div>
    </div>
  );
}
