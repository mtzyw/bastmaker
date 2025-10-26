"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Coins } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SOUND_EFFECT_MODEL,
  getSoundEffectModelConfig,
} from "@/lib/ai/sound-effect-config";
import { CreationItem } from "@/lib/ai/creations";
import { useCreationHistoryStore } from "@/stores/creationHistoryStore";
import { useRepromptStore } from "@/stores/repromptStore";

const MIN_DURATION = 0.5;
const MAX_DURATION = 22;

export default function SoundGenerationLeftPanel() {
  const upsertHistoryItem = useCreationHistoryStore((state) => state.upsertItem);
  const removeHistoryItem = useCreationHistoryStore((state) => state.removeItem);
  const repromptDraft = useRepromptStore((state) => state.draft);
  const clearRepromptDraft = useRepromptStore((state) => state.clearDraft);

  const modelConfig = useMemo(
    () => getSoundEffectModelConfig(DEFAULT_SOUND_EFFECT_MODEL),
    []
  );

  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(
    modelConfig.defaultDurationSeconds
  );
  const [loop, setLoop] = useState(false);
  const [promptInfluence, setPromptInfluence] = useState(modelConfig.defaultPromptInfluence);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!repromptDraft || repromptDraft.kind !== "sound-effects") {
      return;
    }

    setPrompt(repromptDraft.prompt ?? "");
    setTranslatePrompt(Boolean(repromptDraft.translatePrompt));

    const nextDuration =
      typeof repromptDraft.durationSeconds === "number"
        ? Math.min(Math.max(repromptDraft.durationSeconds, MIN_DURATION), MAX_DURATION)
        : modelConfig.defaultDurationSeconds;
    setDurationSeconds(Number(nextDuration.toFixed(1)));

    setLoop(typeof repromptDraft.loop === "boolean" ? repromptDraft.loop : false);

    const nextInfluence =
      typeof repromptDraft.promptInfluence === "number"
        ? Math.min(Math.max(repromptDraft.promptInfluence, 0), 1)
        : modelConfig.defaultPromptInfluence;
    setPromptInfluence(Number(nextInfluence.toFixed(2)));

    clearRepromptDraft();
  }, [repromptDraft, clearRepromptDraft, modelConfig]);

  const handleCreate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const optimisticCreatedAt = new Date().toISOString();
    const normalizedDuration = Math.min(Math.max(durationSeconds, MIN_DURATION), MAX_DURATION);
    const normalizedInfluence = Math.min(Math.max(promptInfluence, 0), 1);
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
          source: "sound",
          mode: "text",
          translate_prompt: translatePrompt,
          credits_cost: effectiveCredits,
          prompt: trimmedPrompt,
          original_prompt: trimmedPrompt,
          duration_seconds: normalizedDuration,
          loop,
          prompt_influence: normalizedInfluence,
          modality_code: modelConfig.defaultModality,
        },
        inputParams: {
          model: DEFAULT_SOUND_EFFECT_MODEL,
          text: trimmedPrompt,
          duration_seconds: normalizedDuration,
          loop,
          prompt_influence: normalizedInfluence,
        },
        modalityCode: modelConfig.defaultModality,
        modelSlug: DEFAULT_SOUND_EFFECT_MODEL,
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

    const tempJobId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `temp-${crypto.randomUUID()}`
        : `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const optimisticItem = buildHistoryItem({
      jobId: tempJobId,
      status: "processing",
      latestStatus: "processing",
    });
    upsertHistoryItem(optimisticItem);

    try {
      const response = await fetch("/api/ai/freepik/sound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmedPrompt,
          duration_seconds: normalizedDuration,
          loop,
          prompt_influence: normalizedInfluence,
          translate_prompt: translatePrompt,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.success) {
        const message = result?.error ?? response.statusText ?? "提交失败";
        throw new Error(message);
      }

      removeHistoryItem(tempJobId);

      const taskInfo = result.data as {
        jobId?: string;
        providerJobId?: string;
        status?: string;
        freepikStatus?: string;
        creditsCost?: number;
        updatedBenefits?: { totalAvailableCredits?: number };
      };

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
    } catch (error) {
      removeHistoryItem(tempJobId);
      const message = error instanceof Error ? error.message : "提交失败，请稍后重试";
      setErrorMessage(message);
      console.error("[sound-generation] submit error", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    durationSeconds,
    loop,
    modelConfig,
    prompt,
    promptInfluence,
    translatePrompt,
    isSubmitting,
    upsertHistoryItem,
    removeHistoryItem,
  ]);

  const handleDurationChange = (value: number) => {
    const clamped = Math.min(Math.max(value, MIN_DURATION), MAX_DURATION);
    setDurationSeconds(Number(clamped.toFixed(1)));
  };

  return (
    <div className="w-full h-full min-h-0 text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]">
        <div className="pr-1 md:pr-7">
          <h1 className="text-2xl font-semibold mt-2 mb-4 h-11 flex items-center">文生音效</h1>

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
                placeholder="描述你想听到的音效..."
                className="min-h-[140px] max-h-[320px] resize-y overflow-auto textarea-scrollbar bg-transparent text-white placeholder:text-white/60 border-0 focus-visible:ring-0 focus-visible:outline-none"
                maxLength={2500}
              />
            </div>
            <div className="h-px bg-white/10 mx-3 mt-2" />
            <div className="flex items-center justify-end px-3 py-3">
              <div className="flex items-center gap-3 text-[11px] text-white/60">
                <span>{prompt.length} / 2500</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/70 hover:text-white"
                  onClick={() => setPrompt("")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm text-white/80 mb-2">
                <span>音效时长（秒）</span>
                <span>{durationSeconds.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min={MIN_DURATION}
                max={MAX_DURATION}
                step={0.5}
                value={durationSeconds}
                onChange={(event) => handleDurationChange(Number(event.target.value))}
                className="w-full accent-[#dc2e5a]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-white/80">循环播放</div>
              <Switch checked={loop} onCheckedChange={setLoop} />
            </div>
          </div>

          <div className="mt-4 text-sm text-white/70">
            <span className="">示例：</span> The sound of gentle ocean waves crashing against the shore, rhythmic and
            calming, with soft splashes and distant seagulls in the background
          </div>
        </div>
      </ScrollArea>

      <div className="pt-2 pb-0 shrink-0 border-t border-white/10 -mx-4 md:-mx-6">
        <div className="px-4 md:px-6">
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-pink-400" />
                Credits required:
              </div>
              <div>{modelConfig.creditsCost} Credits</div>
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
            {isSubmitting ? "创建中..." : "创建"}
          </Button>
          {errorMessage ? (
            <p className="mt-3 text-sm text-red-400">{errorMessage}</p>
          ) : null}
        </div>
        <div className="mt-6 border-t border-white/10" />
      </div>
    </div>
  );
}
