"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "@/components/ai/text-image-models";

const DEFAULT_MAX = 8;
function getMaxCountByModel(model: string) {
  if (model === "Nano Banana Free") return 3;
  if (model === "Seedream 4" || model === "Seedream 4 Edit") return 5;
  return DEFAULT_MAX;
}

export default function ImageToImageLeftPanel({
  excludeModels,
}: {
  excludeModels?: string[];
}) {
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState(TEXT_TO_IMAGE_DEFAULT_MODEL);
  const [images, setImages] = useState<File[]>([]);

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

  const maxCount = getMaxCountByModel(model);

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
            <div className="text-xs text-white/60">{images.length}/{maxCount}</div>
          </div>
          <ImageGridUploader
            className="mb-6"
            maxCount={maxCount}
            onChange={(files) => setImages(files)}
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
                "bg-[#dc2e5a] hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]"
            )}
            disabled={!prompt.trim()}
          >
            创建
          </Button>
        </div>
        <div className="mt-6 border-t border-white/10" />
      </div>
    </div>
  );
}
