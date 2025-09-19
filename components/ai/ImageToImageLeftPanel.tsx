"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import ImageGridUploader from "@/components/ai/ImageGridUploader";
import { Coins, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [model, setModel] = useState("Nano Banana Free");
  const [images, setImages] = useState<File[]>([]);

  const allModels = [
    "Nano Banana Free",
    "Flux Dev",
    "Hyperflux",
    "Google Imagen4",
    "Seedream 4",
    "Seedream 4 Edit",
  ];
  const models = allModels.filter((m) => !(excludeModels ?? []).includes(m));
  useEffect(() => {
    if (!models.includes(model)) setModel(models[0] ?? "Nano Banana Free");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models.join("|")]);

  const maxCount = getMaxCountByModel(model);

  return (
    <div className="w-full h-full min-h-0 text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0">
        <div className="pr-1">
          {/* Title */}
          <h1 className="text-2xl font-semibold mt-2 mb-4 h-11 flex items-center">Image to Image</h1>

          {/* Model */}
          <div className="mb-2 text-sm">Model</div>
          <div className="mb-6">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-[10px] leading-none font-bold">G</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <SelectValue placeholder="Select a model" />
                    <span className="text-[11px] text-white/60">Ultra-high character consistency</span>
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <div className="p-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What do you want to create?"
                className="min-h-[180px] resize-none bg-transparent text-white placeholder:text-white/50"
                maxLength={2000}
              />
            </div>
            <div className="flex items-center justify-between px-3 pb-3 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </div>
              <div>{prompt.length} / 2000</div>
            </div>
          </div>

          {/* Output moved to fixed bottom region */}
        </div>
      </ScrollArea>

      {/* Fixed bottom area: Output + Create */}
      <div className="pt-2 pb-5 shrink-0">
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
          <Sparkles className="w-4 h-4 mr-2" />
          Create
        </Button>
        <div className="mt-6 border-t border-white/10" />
      </div>
    </div>
  );
}
