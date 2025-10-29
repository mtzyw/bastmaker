import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
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

const STATUS_LABELS: Record<string, string> = {
  pending: "准备中",
  queued: "排队中",
  processing: "生成中",
  completed: "已完成",
  failed: "已失败",
  CREATED: "已创建",
  IN_PROGRESS: "生成中",
  COMPLETED: "已完成",
  FAILED: "已失败",
};

function formatStatusLabel(status?: string | null) {
  if (!status) {
    return null;
  }
  const direct = STATUS_LABELS[status];
  if (direct) {
    return direct;
  }
  const upper = STATUS_LABELS[status.toUpperCase()];
  if (upper) {
    return upper;
  }
  return status;
}

type TextToVideoPromptEnhancerProps = {
  prompt: string;
  onApply: (value: string) => void;
  className?: string;
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

export function TextToVideoPromptEnhancer({
  prompt,
  onApply,
  className,
}: TextToVideoPromptEnhancerProps) {
  const locale = useLocale();
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
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
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
      setStatusLabel(null);
      setErrorMessage(null);
      setIsLoading(false);
    } else {
      abortRef.current = true;
      setIsLoading(false);
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
          json?.error ?? response.statusText ?? "查询提示词优化任务失败";
        throw new Error(message);
      }

      const improvement = json?.data?.improvement;
      if (!improvement) {
        throw new Error("提示词优化任务不存在");
      }

      const statusSource = improvement.freepikStatus ?? improvement.status;
      setStatusLabel(
        formatStatusLabel(statusSource) ?? formatStatusLabel(improvement.status),
      );

      if (improvement.status === "failed") {
        const message = improvement.errorMessage ?? "提示词优化失败，请稍后重试。";
        throw new Error(message);
      }

      if (improvement.generatedPrompts.length > 0) {
        setSuggestions(improvement.generatedPrompts);
        setErrorMessage(null);
        setStatusLabel(
          formatStatusLabel(statusSource) ?? formatStatusLabel("completed"),
        );
        return;
      }
    }

    throw new Error("提示词优化超时，请稍后重试。");
  }, []);

  const handleGenerate = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setErrorMessage("请输入提示词内容");
      return;
    }
    abortRef.current = false;
    setIsLoading(true);
    setSuggestions([]);
    setStatusLabel(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/ai/prompt-improvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          language,
          targetType: "video",
        }),
      });

      let json: PromptImprovementResponse | null = null;
      try {
        json = (await response.json()) as PromptImprovementResponse;
      } catch {
        json = null;
      }

      if (!response.ok || !json?.success) {
        const message = json?.error ?? response.statusText ?? "生成失败，请稍后重试";
        throw new Error(message);
      }

      const improvement = json?.data?.improvement;
      if (!improvement) {
        throw new Error("创建提示词优化任务失败，请稍后重试");
      }

      const statusSource = improvement.freepikStatus ?? improvement.status;
      if (statusSource) {
        setStatusLabel(
          formatStatusLabel(statusSource) ?? formatStatusLabel(improvement.status),
        );
      }

      if (improvement.status === "failed") {
        const message =
          improvement.errorMessage ?? "提示词优化失败，请稍后重试。";
        throw new Error(message);
      }

      if (improvement.generatedPrompts.length > 0) {
        setSuggestions(improvement.generatedPrompts);
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
        error instanceof Error ? error.message : "生成失败，请稍后重试";
      setStatusLabel(null);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (value: string) => {
    onApply(value);
    abortRef.current = true;
    setOpen(false);
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
          AI提示词
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-[#111]/95 text-white border border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            <Sparkles className="h-4 w-4 text-[#dc2e5a]" />
            智能优化提示词
          </DialogTitle>
          <DialogDescription className="text-sm text-white/60">
            输入想法后自动优化为更适合视频生成的描述。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs text-white/60">输入你的想法</div>
            <Textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="例如：一只猫在月光下跳舞"
              className="min-h-[120px] resize-y bg-white/5 text-white placeholder:text-white/40 border border-white/10 focus-visible:ring-0"
              maxLength={2500}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{inputValue.length} / 2500</span>
            {statusLabel ? (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                状态：{statusLabel}
              </span>
            ) : null}
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
                  生成中...
                </>
              ) : (
                "生成优化提示词"
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
              <div className="text-xs text-white/60">优化结果</div>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-white/5">
                <div className="p-3 space-y-2">
                  {suggestions.map((entry, index) => (
                    <div
                      key={`${entry}-${index}`}
                      className="rounded-lg border border-transparent bg-white/8 px-3 py-2 text-sm text-white/80 transition"
                    >
                      <div className="whitespace-pre-wrap break-words">{entry}</div>
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          className="h-7 bg-[#dc2e5a] hover:bg-[#dc2e5a]/90 text-xs px-3"
                          onClick={() => handleApply(entry)}
                        >
                          使用该提示词
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
