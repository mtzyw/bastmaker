"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import ImageGridUploader from "@/components/ai/ImageGridUploader";
import { Coins, Trash2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIModelDropdown } from "@/components/ai/AIModelDropdown";
import {
  TEXT_TO_IMAGE_DEFAULT_MODEL,
  TEXT_TO_IMAGE_MODEL_OPTIONS,
  getTextToImageApiModel,
} from "@/components/ai/text-image-models";
import { CreationItem } from "@/lib/ai/creations";
import { useCreationHistoryStore } from "@/stores/creationHistoryStore";
import { getTextToImageModelConfig } from "@/lib/ai/text-to-image-config";

const DEFAULT_MAX = 8;
function getMaxCountByModel(model: string) {
  if (model === "Nano Banana Free") return 3;
  if (model === "Seedream 4" || model === "Seedream 4 Edit") return 5;
  return DEFAULT_MAX;
}

type ReferenceImage = {
  file: File;
  remoteUrl: string | null;
  uploading: boolean;
  error: string | null;
};

export default function ImageToImageLeftPanel({
  excludeModels,
}: {
  excludeModels?: string[];
}) {
  const upsertHistoryItem = useCreationHistoryStore((state) => state.upsertItem);
  const removeHistoryItem = useCreationHistoryStore((state) => state.removeItem);
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState(TEXT_TO_IMAGE_DEFAULT_MODEL);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const availableOptions = useMemo(() => {
    const excludeSet = new Set(excludeModels ?? []);
    const filtered = TEXT_TO_IMAGE_MODEL_OPTIONS.filter((option) => !excludeSet.has(option.value));
    return filtered.length > 0 ? filtered : TEXT_TO_IMAGE_MODEL_OPTIONS;
  }, [excludeModels]);

  useEffect(() => {
    const allowedValues = availableOptions.map((option) => option.value);
    if (!allowedValues.includes(model)) {
      setModel(allowedValues[0] ?? TEXT_TO_IMAGE_DEFAULT_MODEL);
    }
  }, [availableOptions, model]);

  useEffect(() => {
    if (referenceImages.length > 0 && errorMessage === "请至少上传一张参考图") {
      setErrorMessage(null);
    }
  }, [referenceImages.length, errorMessage]);

  const uploadReferenceImage = useCallback(async (file: File) => {
    setReferenceImages((prev) => {
      const index = prev.findIndex((item) => item.file === file);
      if (index === -1) {
        return prev;
      }
      const next = [...prev];
      next[index] = { ...next[index], uploading: true, error: null };
      return next;
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/image-to-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.success) {
        const message = typeof result?.error === "string" ? result.error : response.statusText ?? "图片上传失败";
        throw new Error(message);
      }

      const remoteUrl = result?.data?.url;
      if (typeof remoteUrl !== "string" || remoteUrl.length === 0) {
        throw new Error("图片上传结果异常");
      }

      setReferenceImages((prev) => {
        const index = prev.findIndex((item) => item.file === file);
        if (index === -1) {
          return prev;
        }
        const next = [...prev];
        next[index] = { ...next[index], uploading: false, remoteUrl, error: null };
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "图片上传失败，请稍后重试";
      setReferenceImages((prev) => {
        const index = prev.findIndex((item) => item.file === file);
        if (index === -1) {
          return prev;
        }
        const next = [...prev];
        next[index] = { ...next[index], uploading: false, remoteUrl: null, error: message };
        return next;
      });
      setErrorMessage(message);
    }
  }, []);

  const handleImagesChange = useCallback(
    (files: File[]) => {
      const newFiles = files.filter((file) => !referenceImages.some((item) => item.file === file));

      setReferenceImages((prev) => {
        const existingMap = new Map(prev.map((item) => [item.file, item] as const));
        return files.map((file) => {
          const existing = existingMap.get(file);
          if (existing) {
            return existing;
          }
          return { file, remoteUrl: null, uploading: true, error: null };
        });
      });

      if (newFiles.length > 0) {
        if (errorMessage) {
          setErrorMessage(null);
        }
        setStatusMessage(null);
      }

      newFiles.forEach((file) => {
        void uploadReferenceImage(file);
      });

      if (files.length === 0) {
        setStatusMessage(null);
      }
    },
    [referenceImages, uploadReferenceImage, errorMessage]
  );

  const maxCount = getMaxCountByModel(model);
  const apiModel = useMemo(() => getTextToImageApiModel(model), [model]);
  const modelConfig = useMemo(() => getTextToImageModelConfig(apiModel), [apiModel]);
  const isUploading = referenceImages.some((item) => item.uploading);
  const hasPendingUploads = referenceImages.some((item) => !item.remoteUrl);
  const disableSubmit =
    !prompt.trim() ||
    referenceImages.length === 0 ||
    isSubmitting ||
    isUploading ||
    hasPendingUploads;

  const handleCreate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isSubmitting) {
      return;
    }

    if (referenceImages.length === 0) {
      setErrorMessage("请至少上传一张参考图");
      return;
    }

    if (isUploading) {
      setErrorMessage("图片上传中，请稍候");
      return;
    }

    const unresolved = referenceImages.filter((item) => !item.remoteUrl);
    if (unresolved.length > 0) {
      const firstError = unresolved.find((item) => item.error)?.error;
      setErrorMessage(firstError ?? "图片上传尚未完成，请重新上传");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const optimisticCreatedAt = new Date().toISOString();
    let tempJobId: string | null = null;

    try {
      const referenceUrls = referenceImages
        .map((item) => item.remoteUrl)
        .filter((url): url is string => typeof url === "string" && url.length > 0);

      if (referenceUrls.length === 0) {
        throw new Error("参考图上传失败，请重新上传");
      }

      const referenceCount = referenceUrls.length;
      const buildHistoryItem = ({
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
        createdAt?: string;
        costCredits?: number;
      }): CreationItem => {
        const effectiveStatus = status || "processing";
        const effectiveLatest = latestStatus ?? effectiveStatus;
        const effectiveCredits =
          typeof costCredits === "number" ? costCredits : modelConfig.creditsCost;

        return {
          jobId,
          providerCode: modelConfig.providerCode,
          providerJobId: providerJobId ?? null,
          status: effectiveStatus,
          latestStatus: effectiveLatest,
          createdAt: createdAt ?? optimisticCreatedAt,
          costCredits: effectiveCredits,
          outputs: [],
        metadata: {
          source: "image-to-image",
          translate_prompt: translatePrompt,
          credits_cost: effectiveCredits,
          freepik_latest_status: effectiveLatest,
          freepik_initial_status: effectiveStatus,
          freepik_task_id: providerJobId ?? null,
          modality_code: "i2i",
          prompt: trimmedPrompt,
          original_prompt: trimmedPrompt,
          is_image_to_image: true,
          reference_image_count: referenceCount,
          reference_images: referenceUrls,
          reference_inputs: {
            primary: referenceCount > 0,
          },
          reference_image_urls: referenceUrls,
          primary_image_url: referenceUrls[0] ?? null,
        },
        inputParams: {
          model: apiModel,
          prompt: trimmedPrompt,
          reference_images: referenceUrls,
          translate_prompt: translatePrompt,
          reference_image_urls: referenceUrls,
          primary_image_url: referenceUrls[0] ?? null,
        },
          modalityCode: "i2i",
          modelSlug: apiModel,
          errorMessage: null,
          seed: null,
          isImageToImage: true,
          referenceImageCount: referenceCount,
          shareSlug: null,
          shareVisitCount: 0,
          shareConversionCount: 0,
          publicTitle: null,
          publicSummary: null,
        };
      };

      tempJobId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? `temp-${crypto.randomUUID()}`
          : `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      upsertHistoryItem(
        buildHistoryItem({ jobId: tempJobId, status: "processing", latestStatus: "processing" })
      );

      const payload = {
        model: apiModel,
        prompt: trimmedPrompt,
        reference_images: referenceUrls,
        translate_prompt: translatePrompt,
      };

      const response = await fetch("/api/ai/freepik/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        const message = result?.error ?? response.statusText ?? "提交失败";
        throw new Error(message);
      }

      const taskInfo = result.data as {
        jobId?: string;
        providerJobId?: string;
        status?: string;
        freepikStatus?: string;
        creditsCost?: number;
        updatedBenefits?: { totalAvailableCredits?: number };
      };

      removeHistoryItem(tempJobId);

      if (taskInfo?.jobId) {
        const optimisticStatus = taskInfo.status ?? "processing";
        const latestStatus = taskInfo.freepikStatus ?? optimisticStatus;
        const credits =
          typeof taskInfo.creditsCost === "number"
            ? taskInfo.creditsCost
            : modelConfig.creditsCost;

        upsertHistoryItem(
          buildHistoryItem({
            jobId: taskInfo.jobId,
            status: optimisticStatus,
            latestStatus,
            providerJobId: taskInfo.providerJobId ?? null,
            createdAt: optimisticCreatedAt,
            costCredits: credits,
          })
        );
      }

      const parts: string[] = ["任务已提交，请稍后在生成记录页查看进度。"];

      if (typeof taskInfo?.creditsCost === "number" && taskInfo.creditsCost > 0) {
        parts.push(`本次扣除 ${taskInfo.creditsCost} Credits`);
      }

      const remainingCredits = taskInfo?.updatedBenefits?.totalAvailableCredits;
      if (typeof remainingCredits === "number") {
        parts.push(`当前余额 ${remainingCredits} Credits`);
      }

      setStatusMessage(parts.join("，"));

      console.debug("[image-to-image] submit payload", payload, result);
    } catch (error) {
      if (tempJobId) {
        removeHistoryItem(tempJobId);
      }
      const message = error instanceof Error ? error.message : "提交失败，请稍后重试";
      setErrorMessage(message);
      console.error("[image-to-image] submit error", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    apiModel,
    isSubmitting,
    isUploading,
    modelConfig,
    prompt,
    referenceImages,
    removeHistoryItem,
    translatePrompt,
    upsertHistoryItem,
  ]);

  return (
    <div className="w-full h-full min-h-0 text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]">
        <div className="pr-1 md:pr-7">
          {/* Title */}
          <h1 className="text-2xl font-semibold mt-2 mb-4 h-11 flex items-center">Image to Image</h1>

          {/* Model */}
          <div className="mb-2 text-sm">Model</div>
          <div className="mb-6">
            <AIModelDropdown
              options={availableOptions}
              value={model}
              onChange={setModel}
            />
          </div>

          {/* Images */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm">Images</div>
            <div className="text-xs text-white/60">{referenceImages.length}/{maxCount}</div>
          </div>
          <ImageGridUploader
            className="mb-6"
            maxCount={maxCount}
            onChange={handleImagesChange}
          />

          {/* Prompt */}
          <div className="flex items-center justify-between mt-3 mb-2">
            <div className="text-sm">Prompt</div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>Translate Prompt</span>
              <Switch checked={translatePrompt} onCheckedChange={setTranslatePrompt} />
            </div>
          </div>
          <div className="rounded-xl bg-white/8 border border-white/10">
            <div className="px-3 pt-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What do you want to create?"
                className="min-h-[140px] max-h-[320px] resize-y overflow-auto textarea-scrollbar bg-transparent text-white placeholder:text-white/60 border-0 focus-visible:ring-0 focus-visible:outline-none"
                maxLength={2000}
              />
            </div>
            <div className="h-px bg-white/10 mx-3 mt-2" />
            <div className="flex items-center justify-between px-3 py-3">
              <Button variant="secondary" onClick={() => {}} className="h-8 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs">
                <Wand2 className="w-3.5 h-3.5 mr-2" />
                Generate with AI
              </Button>
              <div className="flex items-center gap-3 text-[11px] text-white/60">
                <span>{prompt.length} / 2000</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white" onClick={() => setPrompt("")}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Output moved to fixed bottom region */}
        </div>
      </ScrollArea>

      {/* 固定底部：Output + 创建按钮，与文字转图片保持一致 */}
      <div className="pt-2 pb-0 shrink-0 border-t border-white/10 -mx-4 md:-mx-6">
        <div className="px-4 md:px-6">
          <div className="mb-3">
            <div className="mb-2 text-sm">Output Image Number</div>
            <div className="flex items-center justify-between text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-pink-400" />
                Credits required:
              </div>
              <div>4 Credits</div>
            </div>
          </div>
          <Button
            className={cn(
              "w-full h-12 text-white transition-colors bg-gray-900 disabled:bg-gray-900 disabled:text-white/50 disabled:opacity-100",
              prompt.trim() &&
                "bg-[#dc2e5a] hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]",
              isSubmitting && "cursor-wait"
            )}
            disabled={disableSubmit}
            onClick={() => void handleCreate()}
          >
            {isSubmitting ? "创建中..." : "创建"}
          </Button>
          {isUploading ? (
            <p className="mt-3 text-sm text-white/70">参考图上传中，请稍候...</p>
          ) : null}
          {errorMessage ? (
            <p className="mt-3 text-sm text-red-400">{errorMessage}</p>
          ) : null}
          {statusMessage ? (
            <p className="mt-3 text-sm text-emerald-400">{statusMessage}</p>
          ) : null}
        </div>
        <div className="mt-6 border-t border-white/10" />
      </div>
    </div>
  );
}
