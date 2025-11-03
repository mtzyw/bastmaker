"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ImageGridUploader from "@/components/ai/ImageGridUploader";
import { Coins, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIModelDropdown } from "@/components/ai/AIModelDropdown";
import {
  TEXT_TO_IMAGE_DEFAULT_MODEL,
  TEXT_TO_IMAGE_MODEL_OPTIONS,
  getTextToImageApiModel,
} from "@/components/ai/text-image-models";
import { CreationItem } from "@/lib/ai/creations";
import { useCreationHistoryStore } from "@/stores/creationHistoryStore";
import { useRepromptStore } from "@/stores/repromptStore";
import { getTextToImageModelConfig } from "@/lib/ai/text-to-image-config";
import { PromptEnhancer } from "@/components/ai/PromptEnhancer";
import { Switch } from "@/components/ui/switch";

const DEFAULT_MAX = 8;
function getMaxCountByModel(model: string) {
  if (model === "Nano Banana Free") return 3;
  if (model === "Seedream 4" || model === "Seedream 4 Edit") return 5;
  return DEFAULT_MAX;
}

type ReferenceImage = {
  id: string;
  file: File | null;
  remoteUrl: string | null;
  previewUrl: string;
  uploading: boolean;
  error: string | null;
  source: "local" | "remote";
};

export default function ImageToImageLeftPanel({
  excludeModels,
}: {
  excludeModels?: string[];
}) {
  const upsertHistoryItem = useCreationHistoryStore((state) => state.upsertItem);
  const removeHistoryItem = useCreationHistoryStore((state) => state.removeItem);
  const repromptDraft = useRepromptStore((state) => state.draft);
  const clearRepromptDraft = useRepromptStore((state) => state.clearDraft);
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState(TEXT_TO_IMAGE_DEFAULT_MODEL);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const referenceImagesRef = useRef<ReferenceImage[]>([]);

  useEffect(() => {
    referenceImagesRef.current = referenceImages;
  }, [referenceImages]);

  useEffect(() => {
    return () => {
      referenceImagesRef.current.forEach((item) => {
        if (item.source === "local" && item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const availableOptions = useMemo(() => {
    const excludeSet = new Set(excludeModels ?? []);
    const filtered = TEXT_TO_IMAGE_MODEL_OPTIONS.filter((option) => !excludeSet.has(option.value));
    return filtered.length > 0 ? filtered : TEXT_TO_IMAGE_MODEL_OPTIONS;
  }, [excludeModels]);

  const maxCount = getMaxCountByModel(model);

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

  useEffect(() => {
    if (!repromptDraft || repromptDraft.kind !== "image-to-image") {
      return;
    }

    setPrompt(repromptDraft.prompt ?? "");
    setTranslatePrompt(Boolean(repromptDraft.translatePrompt));
    if (typeof repromptDraft.isPublic === "boolean") {
      setIsPublic(repromptDraft.isPublic);
    }

    if (repromptDraft.model) {
      const allowedValues = availableOptions.map((option) => option.value);
      const matchedModel =
        allowedValues.includes(repromptDraft.model)
          ? repromptDraft.model
          : availableOptions.find((option) => option.label === repromptDraft.model)?.value ??
            allowedValues[0] ??
            TEXT_TO_IMAGE_DEFAULT_MODEL;
      setModel(matchedModel);
    }

    const urls = repromptDraft.referenceImageUrls.slice(0, maxCount);
    setReferenceImages((prev) => {
      prev.forEach((item) => {
        if (item.source === "local" && item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      return urls.map((url, index) => {
        const id =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `remote-${Date.now()}-${index}`;
        return {
          id,
          file: null,
          remoteUrl: url,
          previewUrl: url,
          uploading: false,
          error: null,
          source: "remote" as const,
        };
      });
    });

    clearRepromptDraft();
  }, [repromptDraft, availableOptions, clearRepromptDraft, maxCount]);

  const uploadReferenceImage = useCallback(async (imageId: string, file: File) => {
    setReferenceImages((prev) =>
      prev.map((item) =>
        item.id === imageId ? { ...item, uploading: true, error: null } : item
      )
    );

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

      setReferenceImages((prev) =>
        prev.map((item) =>
          item.id === imageId ? { ...item, uploading: false, remoteUrl, error: null } : item
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "图片上传失败，请稍后重试";
      setReferenceImages((prev) =>
        prev.map((item) =>
          item.id === imageId
            ? { ...item, uploading: false, remoteUrl: null, error: message }
            : item
        )
      );
      setErrorMessage(message);
    }
  }, []);

  const handleAddLocalFiles = useCallback(
    (files: File[]) => {
      if (!files || files.length === 0) {
        return;
      }

      const available = Math.max(0, maxCount - referenceImages.length);
      if (available <= 0) {
        return;
      }

      const limited = files.slice(0, available);
      const newImages = limited.map((file) => {
        const id =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const previewUrl = URL.createObjectURL(file);
        return {
          id,
          file,
          remoteUrl: null,
          previewUrl,
          uploading: true,
          error: null,
          source: "local" as const,
        };
      });

      setReferenceImages((prev) => [...prev, ...newImages]);

      if (errorMessage) {
        setErrorMessage(null);
      }
      setStatusMessage(null);

      newImages.forEach((image) => {
        if (image.file) {
          void uploadReferenceImage(image.id, image.file);
        }
      });
    },
    [maxCount, referenceImages.length, errorMessage, uploadReferenceImage]
  );

  const handleRemoveImage = useCallback((id: string) => {
    setReferenceImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && target.source === "local" && target.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
    setStatusMessage(null);
    if (errorMessage) {
      setErrorMessage(null);
    }
  }, [errorMessage]);

  useEffect(() => {
    setReferenceImages((prev) => {
      if (prev.length <= maxCount) {
        return prev;
      }
      const trimmed = prev.slice(0, maxCount);
      prev.slice(maxCount).forEach((item) => {
        if (item.source === "local" && item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      return trimmed;
    });
  }, [maxCount]);

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
  const gridItems = referenceImages.map((item) => ({
    id: item.id,
    url: item.previewUrl,
    source: item.source,
    uploading: item.uploading,
    error: item.error,
  }));

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
            is_public: isPublic,
          },
          inputParams: {
            model: apiModel,
            prompt: trimmedPrompt,
            reference_images: referenceUrls,
            translate_prompt: translatePrompt,
            reference_image_urls: referenceUrls,
            primary_image_url: referenceUrls[0] ?? null,
            is_public: isPublic,
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
        is_public: isPublic,
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

      const parts: string[] = [];

      if (typeof taskInfo?.creditsCost === "number" && taskInfo.creditsCost > 0) {
        parts.push(`本次扣除 ${taskInfo.creditsCost} Credits`);
      }

      const remainingCredits = taskInfo?.updatedBenefits?.totalAvailableCredits;
      if (typeof remainingCredits === "number") {
        parts.push(`当前余额 ${remainingCredits} Credits`);
      }

      setStatusMessage(parts.length > 0 ? parts.join("，") : null);

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
    isPublic,
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
            items={gridItems}
            onAdd={handleAddLocalFiles}
            onRemove={handleRemoveImage}
          />

          {/* Prompt */}
          <div className="text-sm mt-3 mb-2">Prompt</div>
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
              <PromptEnhancer
                prompt={prompt}
                onApply={(value) => setPrompt(value)}
                targetType="image"
              />
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
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-white/80">
            <div className="flex flex-col">
              <span>公开到个人主页</span>
              <span className="text-xs text-white/50">关闭后仅自己可见</span>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <div className="mb-3">
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
