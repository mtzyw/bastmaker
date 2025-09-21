"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Wand2, Trash2, Coins } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatioSelector } from "@/components/ai/AspectRatioSelector";
import { cn } from "@/lib/utils";
import { AIModelDropdown } from "@/components/ai/AIModelDropdown";
import {
  TEXT_TO_IMAGE_DEFAULT_MODEL,
  TEXT_TO_IMAGE_MODEL_OPTIONS,
  getTextToImageApiModel,
} from "@/components/ai/text-image-models";
import { toFreepikAspectRatio } from "@/lib/ai/freepik";

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
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState(forcedModel ?? TEXT_TO_IMAGE_DEFAULT_MODEL);
  const [aspectRatio, setAspectRatio] = useState("1:1");

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

  const apiAspectRatio = useMemo(() => toFreepikAspectRatio(aspectRatio), [aspectRatio]);
  const apiModel = useMemo(() => getTextToImageApiModel(model), [model]);

  const handleCreate = useCallback(() => {
    if (!prompt.trim()) {
      return;
    }

    const payload = {
      model: apiModel,
      prompt: prompt.trim(),
      aspect_ratio: apiAspectRatio,
      translate_prompt: translatePrompt,
    };

    console.debug("[text-to-image] submit payload", payload);
  }, [apiModel, apiAspectRatio, prompt, translatePrompt]);

  return (
    <div className="w-full h-full min-h-0 text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]">
        <div className="pr-1 md:pr-7">
          {/* 标题 */}
          <h1 className="text-2xl font-semibold mt-2 mb-4 h-11 flex items-center">文字转图片</h1>
          {/* Model 标签 + 选择 */}
          <div className="mb-2 text-sm">Model</div>
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

          {/* 提示词 + 翻译开关 */}
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

          {/* 示例 */}
          <div className="mt-2 text-sm text-white/70">
            <span className="">示例：</span> Wildflower Trail Dolphin Shadow Butterfly Closeup
          </div>

          {/* 长宽比（仅 Flux Dev 显示） */}
          {(model === "Flux Dev" || model === "Hyperflux") && (
            <AspectRatioSelector
              value={aspectRatio}
              onChange={setAspectRatio}
              label="长宽比"
              className="mt-4"
              values={["1:1", "9:16", "1:2", "3:4"]}
            />
          )}
          {model === "Google Imagen4" && (
            <AspectRatioSelector
              value={aspectRatio}
              onChange={setAspectRatio}
              label="长宽比"
              className="mt-4"
              values={["1:1", "9:16", "16:9", "4:3", "3:4"]}
            />
          )}
          {(model === "Seedream 4" || model === "Seedream 4 Edit") && (
            <AspectRatioSelector
              value={aspectRatio}
              onChange={setAspectRatio}
              label="长宽比"
              className="mt-4"
              values={["1:1", "16:9", "9:16", "2:3", "3:4", "3:2", "4:3"]}
            />
          )}

          {/* 输出格式已移除 */}
        </div>
      </ScrollArea>

      {/* 固定底部按钮；上方内容单独滚动 */}
      <div className="pt-2 pb-0 shrink-0 border-t border-white/10 -mx-4 md:-mx-6">
        <div className="px-4 md:px-6">
          {/* 固定区域：Output + credits */}
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
                "bg-[#dc2e5a] hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]"
            )}
            disabled={!prompt.trim()}
            onClick={handleCreate}
          >
            创建
          </Button>
        </div>
        <div className="mt-6 border-t border-white/10" />
      </div>
    </div>
  );
}
