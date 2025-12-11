"use client";

import { AIModelDropdown } from "@/components/ai/AIModelDropdown";
import { AspectRatioInlineSelector } from "@/components/ai/AspectRatioInlineSelector";
import { PromptEnhancer } from "@/components/ai/PromptEnhancer";
import {
  TEXT_TO_IMAGE_DEFAULT_MODEL,
  TEXT_TO_IMAGE_MODEL_OPTIONS,
  getTextToImageApiModel,
  getTextToImageOptionValue,
  getTextToImageStorageModel,
} from "@/components/ai/text-image-models";
import { useAuthDialog } from "@/components/providers/AuthDialogProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSubscriptionPopup } from "@/components/providers/SubscriptionPopupProvider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CreationItem } from "@/lib/ai/creations";
import { toFreepikAspectRatio } from "@/lib/ai/freepik";
import { getTextToImageModelConfig } from "@/lib/ai/text-to-image-config";
import { cn } from "@/lib/utils";
import { useCreationHistoryStore } from "@/stores/creationHistoryStore";
import { useRepromptStore } from "@/stores/repromptStore";
import { Coins, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Copied from TextToVideoLeftPanel and adapted for Text-to-Image
export default function TextToImageLeftPanel({
  forcedModel,
  hideModelSelect = false,
  excludeModels,
}: {
  forcedModel?: string;
  hideModelSelect?: boolean;
  excludeModels?: string[];
} = {}) {
  const upsertHistoryItem = useCreationHistoryStore((state) => state.upsertItem);
  const removeHistoryItem = useCreationHistoryStore((state) => state.removeItem);
  const repromptDraft = useRepromptStore((state) => state.draft);
  const clearRepromptDraft = useRepromptStore((state) => state.clearDraft);
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState(forcedModel ?? TEXT_TO_IMAGE_DEFAULT_MODEL);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const t = useTranslations("CreationTools.TextToImage");
  const commonT = useTranslations("CreationTools.Common");
  const { user } = useAuth();
  const { openAuthDialog } = useAuthDialog();
  const { openSubscriptionPopup } = useSubscriptionPopup();

  const availableOptions = useMemo(() => {
    const excludeSet = new Set(excludeModels ?? []);
    const filtered = TEXT_TO_IMAGE_MODEL_OPTIONS.filter((option) => !excludeSet.has(option.value));
    return filtered.length > 0 ? filtered : TEXT_TO_IMAGE_MODEL_OPTIONS;
  }, [excludeModels]);

  useEffect(() => {
    const allowedValues = availableOptions.map((option) => option.value);
    if (forcedModel && allowedValues.includes(forcedModel) && forcedModel !== model) {
      setModel(forcedModel);
      return;
    }
    if (!allowedValues.includes(model)) {
      setModel(allowedValues[0] ?? TEXT_TO_IMAGE_DEFAULT_MODEL);
    }
  }, [availableOptions, forcedModel, model]);

  const aspectOptions = useMemo(() => {
    if (model === "Flux Dev" || model === "Flux Pro 1.1" || model === "Hyperflux") {
      return ["1:1", "9:16", "1:2", "3:4"];
    }
    if (model === "Google Imagen4") {
      return ["1:1", "9:16", "16:9", "4:3", "3:4"];
    }
    if (model === "Seedream 4" || model === "Seedream 4 Edit") {
      return ["1:1", "16:9", "9:16", "3:4", "4:3"];
    }
    return [] as string[];
  }, [model]);

  useEffect(() => {
    if (aspectOptions.length === 0) {
      return;
    }
    if (!aspectOptions.includes(aspectRatio)) {
      setAspectRatio(aspectOptions[0]);
    }
  }, [aspectOptions, aspectRatio]);

  useEffect(() => {
    if (!repromptDraft || repromptDraft.kind !== "text-to-image") {
      return;
    }

    setPrompt(repromptDraft.prompt ?? "");
    setTranslatePrompt(Boolean(repromptDraft.translatePrompt));

    if (repromptDraft.model) {
      const allowedValues = availableOptions.map((option) => option.value);
      const aliasCandidate = getTextToImageOptionValue(repromptDraft.model);
      const matchByValue = allowedValues.includes(repromptDraft.model)
        ? repromptDraft.model
        : availableOptions.find((option) => option.label === repromptDraft.model)?.value ??
        (aliasCandidate && allowedValues.includes(aliasCandidate) ? aliasCandidate : null) ??
        allowedValues[0] ??
        TEXT_TO_IMAGE_DEFAULT_MODEL;
      setModel(matchByValue);
    }

    if (repromptDraft.aspectRatio) {
      setAspectRatio(repromptDraft.aspectRatio);
    }

    if (typeof repromptDraft.isPublic === "boolean") {
      setIsPublic(repromptDraft.isPublic);
    }

    clearRepromptDraft();
  }, [repromptDraft, availableOptions, clearRepromptDraft]);

  const apiAspectRatio = useMemo(() => toFreepikAspectRatio(aspectRatio), [aspectRatio]);
  const apiModel = useMemo(() => getTextToImageApiModel(model), [model]);
  const storageModel = useMemo(() => getTextToImageStorageModel(model), [model]);
  const modelConfig = useMemo(
    () => getTextToImageModelConfig(storageModel),
    [storageModel]
  );

  const handleCreate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isSubmitting) {
      return;
    }

    if (!user) {
      openAuthDialog("signin");
      return;
    }

    setIsSubmitting(true);

    const optimisticCreatedAt = new Date().toISOString();
    const isImageToImageModel = modelConfig.defaultModality === "i2i";
    const buildHistoryItem = ({
      jobId,
      status,
      latestStatus,
      providerJobId,
      createdAt,
      costCredits,
      publicVisible,
    }: {
      jobId: string;
      status: string;
      latestStatus?: string | null;
      providerJobId?: string | null;
      createdAt?: string;
      costCredits?: number;
      publicVisible: boolean;
    }): CreationItem => {
      const effectiveStatus = status || "processing";
      const effectiveLatest = latestStatus ?? effectiveStatus;
      const effectiveCredits = typeof costCredits === "number" ? costCredits : modelConfig.creditsCost;

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
          source: "text-to-image",
          translate_prompt: translatePrompt,
          is_image_to_image: isImageToImageModel,
          reference_image_count: 0,
          credits_cost: effectiveCredits,
          freepik_latest_status: effectiveLatest,
          freepik_initial_status: effectiveStatus,
          freepik_task_id: providerJobId ?? null,
          is_public: publicVisible,
          reference_image_urls: [],
          primary_image_url: null,
        },
        inputParams: {
          model: storageModel,
          prompt: trimmedPrompt,
          aspect_ratio: apiAspectRatio,
          translate_prompt: translatePrompt,
          reference_image_count: 0,
          reference_image_urls: [],
          primary_image_url: null,
        },
        modalityCode: modelConfig.defaultModality,
        modelSlug: storageModel,
        errorMessage: null,
        seed: null,
        isImageToImage: isImageToImageModel,
        referenceImageCount: 0,
        shareSlug: null,
        shareVisitCount: 0,
        shareConversionCount: 0,
        publicTitle: null,
        publicSummary: null,
      };
    };

    const tempJobId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `temp-${crypto.randomUUID()}`
        : `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const optimisticTempItem = buildHistoryItem({
      jobId: tempJobId,
      status: "processing",
      latestStatus: "processing",
      publicVisible: isPublic,
    });
    upsertHistoryItem(optimisticTempItem);

    const payload = {
      model: apiModel,
      ui_model_slug: storageModel,
      ui_model_label: model,
      prompt: trimmedPrompt,
      aspect_ratio: apiAspectRatio,
      translate_prompt: translatePrompt,
      is_public: isPublic,
    };

    try {
      const response = await fetch("/api/ai/freepik/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        if (response.status === 402 || response.status === 429) {
          openSubscriptionPopup();
        }
        const message = result?.error ?? response.statusText ?? commonT("errors.submitFailed");
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
        const latestStatus = taskInfo.freepikStatus ?? taskInfo.status ?? optimisticStatus;
        const creditsCost =
          typeof taskInfo.creditsCost === "number" ? taskInfo.creditsCost : modelConfig.creditsCost;

        const optimisticItem = buildHistoryItem({
          jobId: taskInfo.jobId,
          status: optimisticStatus,
          latestStatus,
          providerJobId: taskInfo.providerJobId ?? null,
          createdAt: optimisticCreatedAt,
          costCredits: creditsCost,
          publicVisible: isPublic,
        });

        upsertHistoryItem(optimisticItem);
      }
    } catch (error) {
      removeHistoryItem(tempJobId);
      const message = error instanceof Error ? error.message : commonT("errors.submitFailedRetry");
      toast.error(message);
      console.error("[text-to-image] submit error", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    apiAspectRatio,
    apiModel,
    isSubmitting,
    modelConfig,
    prompt,
    translatePrompt,
    upsertHistoryItem,
    removeHistoryItem,
    commonT,
    user,
    openAuthDialog,
    openSubscriptionPopup,
  ]);

  return (
    <div className="w-full h-full min-h-0 text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]">
        <div className="pr-1 md:pr-7">
          {/* Header */}
          <h1 className="text-2xl font-semibold mt-2 mb-4 h-11 flex items-center">{t("title")}</h1>
          {/* Model selector */}
          <div className="mb-2 text-sm">{commonT("modelLabel")}</div>
          {hideModelSelect ? (
            <div className="text-sm text-white/80 px-3 py-2 rounded bg-white/5 border border-white/10 mb-4">
              {model}
            </div>
          ) : (
            <div className="mb-4">
              <AIModelDropdown
                options={availableOptions}
                value={model}
                onChange={setModel}
              />
            </div>
          )}

          <div className="text-sm mt-3 mb-2">{commonT("promptLabel")}</div>

          <div className="rounded-xl bg-white/8 border border-white/10">
            <div className="px-3 pt-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("placeholder")}
                className="min-h-[140px] max-h-[320px] resize-y overflow-auto textarea-scrollbar bg-transparent text-white placeholder:text-white/60 border-0 focus-visible:ring-0 focus-visible:outline-none"
                maxLength={1000}
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
                <span>{commonT("promptCounter", { count: prompt.length, max: 1000 })}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white" onClick={() => setPrompt("")}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="mt-2 text-sm text-white/70">
            <span>{commonT("exampleLabel")}</span> {t("example")}
          </div>

          <AspectRatioInlineSelector
            className="mt-5"
            value={aspectRatio}
            options={aspectOptions}
            onChange={setAspectRatio}
            label={commonT("aspectRatioLabel")}
            description={commonT("aspectRatioDescription")}
          />

          {/* Output format removed */}
        </div>
      </ScrollArea>

      {/* Fixed bottom action bar */}
      <div className="pt-2 pb-0 shrink-0 border-t border-white/10 -mx-4 md:-mx-6">
        <div className="px-4 md:px-6">
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-white/80">
            <div className="flex flex-col">
              <span>{commonT("publishLabel")}</span>
              <span className="text-xs text-white/50">{commonT("publishDescription")}</span>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          {/* Credits summary */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-pink-400" />
                {commonT("creditsLabel")}:
              </div>
              <div>
                {typeof modelConfig.creditsCost === "number"
                  ? commonT("creditsValue", { count: modelConfig.creditsCost })
                  : "--"}
              </div>
            </div>
          </div>
          <Button
            className={cn(
              "w-full h-12 text-white transition-colors bg-gray-900 disabled:bg-gray-900 disabled:text-white/50 disabled:opacity-100",
              prompt.trim() &&
              "bg-[#dc2e5a] hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]",
              isSubmitting && "cursor-wait"
            )}
            disabled={!prompt.trim() || isSubmitting}
            onClick={() => void handleCreate()}
          >
            {isSubmitting ? commonT("buttons.creating") : commonT("buttons.create")}
          </Button>
        </div>
        <div className="mt-6 border-t border-white/10" />
      </div>
    </div>
  );
}
