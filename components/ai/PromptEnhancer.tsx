import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 8;
const CANCELLED_REQUEST = "__prompt_enhancer_cancelled__";

type PromptEnhancerProps = {
  prompt: string;
  onApply: (value: string) => void;
  className?: string;
  targetType?: "image" | "video";
};

type PromptImprovement = {
  id: string;
  status: string;
  freepikStatus?: string | null;
  generatedPrompts: string[];
  errorMessage?: string | null;
};

type PromptImprovementResponse = {
  data?: {
    improvement?: PromptImprovement;
  };
  error?: string;
  success?: boolean;
};

export function PromptEnhancer({
  prompt,
  onApply,
  className,
  targetType = "video",
}: PromptEnhancerProps) {
  const locale = useLocale();
  const promptT = useTranslations("CreationTools.PromptEnhancer");
  const language = useMemo(() => {
    if (!locale) {
      return undefined;
    }
    const value = locale.toLowerCase().slice(0, 2);
    return /^[a-z]{2}$/.test(value) ? value : undefined;
  }, [locale]);

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(prompt);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] =
    useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef(false);
  const latestPromptRef = useRef(prompt);

  useEffect(() => {
    latestPromptRef.current = prompt;
  }, [prompt]);

  useEffect(() => {
    if (open) {
      abortRef.current = false;
      setInputValue(latestPromptRef.current);
      setSuggestions([]);
      setSelectedSuggestionIndex(null);
      setErrorMessage(null);
      setIsLoading(false);
    } else {
      abortRef.current = true;
      setIsLoading(false);
      setSelectedSuggestionIndex(null);
    }

    return () => {
      abortRef.current = true;
    };
  }, [open]);

  const pollImprovementRecord = useCallback(async (improvementId: string) => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      if (abortRef.current) {
        throw new Error(CANCELLED_REQUEST);
      }

      if (attempt > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (abortRef.current) {
          throw new Error(CANCELLED_REQUEST);
        }
      }

      const response = await fetch(`/api/ai/prompt-improvements/${improvementId}`);
      let json: PromptImprovementResponse | null = null;
      try {
        json = (await response.json()) as PromptImprovementResponse;
      } catch {
        json = null;
      }

      if (!response.ok || !json?.success) {
        const message =
          json?.error ?? response.statusText ?? promptT("errors.fetchFailed");
        throw new Error(message);
      }

      const improvement = json?.data?.improvement;
      if (!improvement) {
        throw new Error(promptT("errors.notFound"));
      }

      if (improvement.status === "failed") {
        const message =
          improvement.errorMessage ?? promptT("errors.improvementFailed");
        throw new Error(message);
      }

      if (improvement.generatedPrompts.length > 0) {
        setSuggestions(improvement.generatedPrompts);
        setSelectedSuggestionIndex(0);
        setErrorMessage(null);
        return;
      }
    }

    throw new Error(promptT("errors.timeout"));
  }, [promptT]);

  const handleGenerate = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setErrorMessage(promptT("errors.inputRequired"));
      return;
    }
    abortRef.current = false;
    setIsLoading(true);
    setSuggestions([]);
    setSelectedSuggestionIndex(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/ai/prompt-improvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          language,
          targetType,
        }),
      });

      let json: PromptImprovementResponse | null = null;
      try {
        json = (await response.json()) as PromptImprovementResponse;
      } catch {
        json = null;
      }

      if (!response.ok || !json?.success) {
        const message =
          json?.error ?? response.statusText ?? promptT("errors.unknown");
        throw new Error(message);
      }

      const improvement = json?.data?.improvement;
      if (!improvement) {
        throw new Error(promptT("errors.createFailed"));
      }

      if (improvement.status === "failed") {
        const message =
          improvement.errorMessage ?? promptT("errors.improvementFailed");
        throw new Error(message);
      }

      if (improvement.generatedPrompts.length > 0) {
        setSuggestions(improvement.generatedPrompts);
        setSelectedSuggestionIndex(0);
        setErrorMessage(null);
        return;
      }

      await pollImprovementRecord(improvement.id);
      if (abortRef.current) {
        throw new Error(CANCELLED_REQUEST);
      }
      setErrorMessage(null);
    } catch (error) {
      if (error instanceof Error && error.message === CANCELLED_REQUEST) {
        return;
      }
      const message =
        error instanceof Error ? error.message : promptT("errors.unknown");
      setErrorMessage(message);
      setSelectedSuggestionIndex(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (value: string) => {
    onApply(value);
    abortRef.current = true;
    setOpen(false);
  };

  const handleApplySelected = () => {
    if (selectedSuggestionIndex === null) {
      return;
    }
    const selected = suggestions[selectedSuggestionIndex];
    if (!selected) {
      return;
    }
    handleApply(selected);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            "h-8 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs",
            className,
          )}
        >
          <Wand2 className="w-3.5 h-3.5 mr-2" />
          {promptT("triggerLabel")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-[#111]/95 text-white border border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            <Sparkles className="h-4 w-4 text-[#dc2e5a]" />
            {promptT("title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-white/60">
            {promptT("subtitle")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs text-white/60">{promptT("inputLabel")}</div>
            <Textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={promptT("inputPlaceholder")}
              className="min-h-[120px] resize-y bg-white/5 text-white placeholder:text-white/40 border border-white/10 focus-visible:ring-0"
              maxLength={2500}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{promptT("charCount", { count: inputValue.length, max: 2500 })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="flex-1 bg-[#dc2e5a] hover:bg-[#dc2e5a]/90"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {promptT("generating")}
                </>
              ) : (
                promptT("generate")
              )}
            </Button>
          </div>
          {errorMessage ? (
            <div className="rounded-lg border border-[#dc2e5a]/40 bg-[#dc2e5a]/10 px-3 py-2 text-sm text-[#ffb7c8]">
              {errorMessage}
            </div>
          ) : null}
          {suggestions.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>{promptT("resultTitle")}</span>
                <Button
                  size="sm"
                  className="h-7 bg-[#dc2e5a] hover:bg-[#dc2e5a]/90 text-xs px-3"
                  onClick={handleApplySelected}
                  disabled={
                    selectedSuggestionIndex === null ||
                    !suggestions[selectedSuggestionIndex]
                  }
                >
                  {promptT("applyButton")}
                </Button>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-white/5">
                <div className="p-3 space-y-2">
                  {suggestions.map((entry, index) => {
                    const isSelected = selectedSuggestionIndex === index;
                    return (
                      <button
                        key={`${entry}-${index}`}
                        type="button"
                        onClick={() => setSelectedSuggestionIndex(index)}
                        className={cn(
                          "w-full rounded-lg border px-3 py-2 text-left text-sm text-white/80 transition focus:outline-none focus:ring-2 focus:ring-white/20",
                          isSelected
                            ? "border-white/30 bg-white/10"
                            : "border-transparent bg-white/8 hover:border-white/15 hover:bg-white/10"
                        )}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {entry}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
