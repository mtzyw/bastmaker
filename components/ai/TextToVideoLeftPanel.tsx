"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Wand2, Trash2, Coins } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AIModelDropdown } from "@/components/ai/AIModelDropdown";
import { CreationItem } from "@/lib/ai/creations";
import { useCreationHistoryStore } from "@/stores/creationHistoryStore";
import { useRepromptStore } from "@/stores/repromptStore";
import { getVideoModelConfig } from "@/lib/ai/video-config";
import {
  AspectRatio,
  DEFAULT_VIDEO_LENGTH,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_VIDEO_RESOLUTION,
  VIDEO_ASPECT_PRESETS,
  VIDEO_MODEL_SELECT_OPTIONS,
  VIDEO_RESOLUTION_PRESETS,
  VideoLengthValue,
  VideoResolutionValue,
  getAllowedVideoLengths,
} from "@/components/ai/video-models";
import { AspectRatioInlineSelector } from "@/components/ai/AspectRatioInlineSelector";

const FALLBACK_ASPECT_RATIO: AspectRatio = "16:9";
const FALLBACK_RESOLUTION: VideoResolutionValue = "720p";
const EXCLUDED_MODELS = new Set(["PixVerse V5 Transition"]);

export default function TextToVideoLeftPanel() {
  const upsertHistoryItem = useCreationHistoryStore((state) => state.upsertItem);
  const removeHistoryItem = useCreationHistoryStore((state) => state.removeItem);
  const repromptDraft = useRepromptStore((state) => state.draft);
  const clearRepromptDraft = useRepromptStore((state) => state.clearDraft);
  const textToVideoOptions = useMemo(
    () => VIDEO_MODEL_SELECT_OPTIONS.filter((option) => !EXCLUDED_MODELS.has(option.value)),
    []
  );
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState(DEFAULT_VIDEO_MODEL);
  const [videoLength, setVideoLength] = useState<VideoLengthValue>(DEFAULT_VIDEO_LENGTH);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => {
    const allowed = VIDEO_ASPECT_PRESETS[DEFAULT_VIDEO_MODEL];
    if (allowed?.includes(FALLBACK_ASPECT_RATIO)) {
      return FALLBACK_ASPECT_RATIO;
    }
    return allowed?.[0] ?? FALLBACK_ASPECT_RATIO;
  });
  const [resolution, setResolution] = useState<VideoResolutionValue>(DEFAULT_VIDEO_RESOLUTION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const hasValidModel = useMemo(
    () => textToVideoOptions.some((option) => option.value === model),
    [model, textToVideoOptions]
  );
  const activeModel = hasValidModel ? model : DEFAULT_VIDEO_MODEL;
  const videoModelConfig = useMemo(() => getVideoModelConfig(activeModel), [activeModel]);

  useEffect(() => {
    if (!hasValidModel) {
      setModel(DEFAULT_VIDEO_MODEL);
    }
  }, [hasValidModel]);

  useEffect(() => {
    if (!resolution) {
      return;
    }

    const allowed = getAllowedVideoLengths(activeModel, resolution);

    if (!allowed.includes(videoLength)) {
      setVideoLength(allowed[0]);
    }
  }, [activeModel, resolution, videoLength]);

  useEffect(() => {
    const allowedAspects = VIDEO_ASPECT_PRESETS[activeModel] ?? [FALLBACK_ASPECT_RATIO];
    if (!allowedAspects.includes(aspectRatio)) {
      if (activeModel === "wan2.2 Plus" && allowedAspects.includes("auto")) {
        setAspectRatio("auto");
        return;
      }
      setAspectRatio(allowedAspects.includes(FALLBACK_ASPECT_RATIO)
        ? FALLBACK_ASPECT_RATIO
        : allowedAspects[0]);
    }
  }, [activeModel, aspectRatio]);

  useEffect(() => {
    const allowedResolutions = VIDEO_RESOLUTION_PRESETS[activeModel] ?? [FALLBACK_RESOLUTION];
    if (!allowedResolutions.includes(resolution)) {
      setResolution(allowedResolutions[0]);
    }
  }, [activeModel, resolution]);

  useEffect(() => {
    if (!repromptDraft || repromptDraft.kind !== "text-to-video") {
      return;
    }

    setPrompt(repromptDraft.prompt ?? "");
    setTranslatePrompt(Boolean(repromptDraft.translatePrompt));

    const optionValues = textToVideoOptions.map((option) => option.value);
    const matchedModel =
      repromptDraft.model && optionValues.includes(repromptDraft.model)
        ? repromptDraft.model
        : textToVideoOptions.find((option) => option.label === repromptDraft.model)?.value ??
          optionValues[0] ??
          DEFAULT_VIDEO_MODEL;
    setModel(matchedModel);

    const resolutionCandidates = VIDEO_RESOLUTION_PRESETS[matchedModel] ?? [FALLBACK_RESOLUTION];
    const preferredResolution =
      repromptDraft.resolution && resolutionCandidates.includes(repromptDraft.resolution as VideoResolutionValue)
        ? (repromptDraft.resolution as VideoResolutionValue)
        : resolutionCandidates[0] ?? FALLBACK_RESOLUTION;
    setResolution(preferredResolution);

    const allowedLengths = getAllowedVideoLengths(matchedModel, preferredResolution);
    const normalizedDuration =
      repromptDraft.duration != null ? String(Math.trunc(repromptDraft.duration)) : undefined;
    let nextVideoLength = allowedLengths[0] ?? DEFAULT_VIDEO_LENGTH;
    if (
      repromptDraft.videoLength &&
      allowedLengths.includes(repromptDraft.videoLength as VideoLengthValue)
    ) {
      nextVideoLength = repromptDraft.videoLength as VideoLengthValue;
    } else if (
      normalizedDuration &&
      allowedLengths.includes(normalizedDuration as VideoLengthValue)
    ) {
      nextVideoLength = normalizedDuration as VideoLengthValue;
    }
    setVideoLength(nextVideoLength);

    if (repromptDraft.aspectRatio) {
      setAspectRatio(repromptDraft.aspectRatio as AspectRatio);
    }

    clearRepromptDraft();
  }, [repromptDraft, textToVideoOptions, clearRepromptDraft]);

  const allowedVideoLengths = getAllowedVideoLengths(activeModel, resolution);
  const isSingleVideoLength = allowedVideoLengths.length === 1;
  const resolutionOptions = VIDEO_RESOLUTION_PRESETS[activeModel] ?? [FALLBACK_RESOLUTION];
  const aspectOptions = VIDEO_ASPECT_PRESETS[activeModel] ?? [FALLBACK_ASPECT_RATIO];
  const selectedModel = textToVideoOptions.find((option) => option.value === activeModel);
  const creditsCost = videoModelConfig.creditsCost ?? selectedModel?.credits ?? 0;
  const hasPrompt = prompt.trim().length > 0;

  const handleCreate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const optimisticCreatedAt = new Date().toISOString();
    let tempJobId: string | null = null;

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
        typeof costCredits === "number" ? costCredits : videoModelConfig.creditsCost;

      return {
        jobId,
        providerCode: videoModelConfig.providerCode,
        providerJobId: providerJobId ?? null,
        status: effectiveStatus,
        latestStatus: effectiveLatest,
        createdAt: createdAt ?? optimisticCreatedAt,
        costCredits: effectiveCredits,
        outputs: [],
        metadata: {
          source: "video",
          mode: "text",
          translate_prompt: translatePrompt,
          resolution,
          aspect_ratio: aspectRatio,
          duration: Number(videoLength),
          credits_cost: effectiveCredits,
          freepik_latest_status: effectiveLatest,
          freepik_initial_status: effectiveStatus,
          freepik_task_id: providerJobId ?? null,
          modality_code: "t2v",
          prompt: trimmedPrompt,
          original_prompt: trimmedPrompt,
          reference_inputs: {
            primary: false,
            tail: false,
            intro: false,
            outro: false,
          },
          reference_image_count: 0,
          reference_image_urls: [],
          primary_image_url: null,
        },
        inputParams: {
          model: activeModel,
          prompt: trimmedPrompt,
          resolution,
          video_length: videoLength,
          duration: Number(videoLength),
          aspect_ratio: aspectRatio,
          translate_prompt: translatePrompt,
          mode: "text",
          reference_image_urls: [],
          primary_image_url: null,
        },
        modalityCode: "t2v",
        modelSlug: activeModel,
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
    };

    try {
      tempJobId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? `temp-${crypto.randomUUID()}`
          : `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const optimisticItem = buildHistoryItem({
        jobId: tempJobId,
        status: "processing",
        latestStatus: "processing",
      });
      upsertHistoryItem(optimisticItem);

      const payload = {
        mode: "text" as const,
        model: activeModel,
        prompt: trimmedPrompt,
        translate_prompt: translatePrompt,
        resolution,
        video_length: videoLength,
        duration: Number(videoLength),
        aspect_ratio: aspectRatio,
      };

      const response = await fetch("/api/ai/freepik/video", {
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
            : videoModelConfig.creditsCost;

        const persistedItem = buildHistoryItem({
          jobId: taskInfo.jobId,
          status: optimisticStatus,
          latestStatus,
          providerJobId: taskInfo.providerJobId ?? null,
          createdAt: optimisticCreatedAt,
          costCredits: credits,
        });
        upsertHistoryItem(persistedItem);
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
      console.error("[text-to-video] submit error", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    activeModel,
    aspectRatio,
    isSubmitting,
    prompt,
    removeHistoryItem,
    resolution,
    translatePrompt,
    upsertHistoryItem,
    videoLength,
    videoModelConfig,
  ]);

  return (
    <div className="w-full h-full text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]">
        <div className="pt-3 pb-6 pr-1 md:pr-7">
          <h1 className="text-2xl font-semibold mb-4 h-11 flex items-center">文字转视频</h1>
          <div className="mb-2 text-sm">Model</div>
          <div className="mb-4">
            <AIModelDropdown
              options={textToVideoOptions}
              value={activeModel}
              onChange={setModel}
            />
          </div>

          <div className="flex items-center justify-between mt-3 mb-2">
            <div className="text-sm">提示词</div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>翻译提示词</span>
              <Switch checked={translatePrompt} onCheckedChange={setTranslatePrompt} />
            </div>
          </div>

          <div className="rounded-xl bg-white/8 border border-white/10">
            <div className="px-3 pt-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="你想要创建什么？"
                className="min-h-[140px] max-h-[320px] resize-y overflow-auto textarea-scrollbar bg-transparent text-white placeholder:text-white/60 border-0 focus-visible:ring-0 focus-visible:outline-none"
                maxLength={1000}
              />
            </div>
            <div className="h-px bg-white/10 mx-3 mt-2" />
            <div className="flex items-center justify-between px-3 py-3">
              <Button variant="secondary" onClick={() => {}} className="h-8 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs">
                <Wand2 className="w-3.5 h-3.5 mr-2" />
                AI提示词
              </Button>
              <div className="flex items-center gap-3 text-[11px] text-white/60">
                <span>{prompt.length} / 1000</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white" onClick={() => setPrompt("")}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {resolutionOptions && resolutionOptions.length > 0 ? (
            <div className="mt-4">
              <div className="text-sm mb-2">Video Resolution</div>
              <div role="radiogroup" aria-label="Video Resolution" className="flex gap-2">
                {resolutionOptions.map((item) => {
                  const isActive = resolution === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setResolution(item)}
                      className={cn(
                        "flex-1 basis-0 rounded-lg border border-white/10 px-3 py-2 text-sm text-center transition-all",
                        isActive
                          ? "bg-[#dc2e5a] text-white shadow-[0_0_12px_rgba(220,46,90,0.35)] border-[#dc2e5a]"
                          : "bg-white/8 text-white/70 hover:bg-white/12"
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <div className="text-sm mb-2">Video Length</div>
            <div
              role="radiogroup"
              aria-label="Video Length"
              className={cn("flex gap-2", isSingleVideoLength && "justify-start")}
            >
              {allowedVideoLengths.map((length) => {
                const isActive = videoLength === length;
                return (
                  <div key={length} className="flex-1 basis-0 flex">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setVideoLength(length)}
                      className={cn(
                        "w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-center transition-all",
                        isActive
                          ? "bg-[#dc2e5a] text-white shadow-[0_0_12px_rgba(220,46,90,0.35)] border-[#dc2e5a]"
                          : "bg-white/8 text-white/70 hover:bg-white/12"
                      )}
                    >
                      {length} 秒
                    </button>
                  </div>
                );
              })}
              {isSingleVideoLength ? (
                <div className="flex-1 basis-0 invisible pointer-events-none" aria-hidden="true" />
              ) : null}
            </div>
          </div>

          <AspectRatioInlineSelector
            className="mt-5"
            value={aspectRatio}
            options={aspectOptions}
            onChange={setAspectRatio}
            label="Aspect Ratio"
            description="Choose the appropriate aspect ratio."
          />

          {/* 示例已移除，保持简洁 */}
          {/* 保留与 text-to-image 一致的结构，不含输出格式 */}
        </div>
      </ScrollArea>

      {/* 固定底部：Output + Create，与 text-to-image 一致 */}
      <div className="pt-2 pb-0 shrink-0 border-t border-white/10 -mx-4 md:-mx-6">
        <div className="px-4 md:px-6">
          <div className="mb-3">
            <div className="mb-2 text-sm">Output Image Number</div>
            <div className="flex items-center justify-between text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-pink-400" />
                Credits required:
              </div>
              <div>{creditsCost ? `${creditsCost} Credits` : "--"}</div>
            </div>
          </div>
          <Button
            className={cn(
              "w-full h-12 text-white transition-colors bg-gray-900 disabled:bg-gray-900 disabled:text-white/50 disabled:opacity-100",
              hasPrompt &&
                "bg-[#dc2e5a] hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]",
              isSubmitting && "cursor-wait"
            )}
            disabled={!hasPrompt || isSubmitting}
            onClick={() => void handleCreate()}
          >
            {isSubmitting ? "创建中..." : "创建"}
          </Button>
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
