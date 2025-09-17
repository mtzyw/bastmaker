"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Trash2, Coins } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatioSelector } from "@/components/ai/AspectRatioSelector";

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
  const [model, setModel] = useState(forcedModel ?? "Nano Banana Free");
  const [aspectRatio, setAspectRatio] = useState("1:1");

  const allModels = [
    "Nano Banana Free",
    "Flux Dev",
    "Hyperflux",
    "Google Imagen4",
    "Seedream 4",
    "Seedream 4 Edit",
  ];
  const models = allModels.filter((m) => !(excludeModels ?? []).includes(m));

  // Ensure current model is valid if options are filtered
  useEffect(() => {
    if (!models.includes(model)) {
      setModel(models[0] ?? "Nano Banana Free");
    }
  }, [models.join("|")]);

  return (
    <div className="w-full h-full min-h-0 text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0">
        <div className="pr-1">
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
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-[10px] leading-none font-bold">G</span>
                    </div>
                    <SelectValue placeholder="选择模型" />
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
          )}

          {/* 提示词 + 翻译开关 */}
          <div className="flex items-center justify-between mt-3 mb-2">
            <div className="text-sm">提示词</div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>翻译提示词</span>
              <Switch checked={translatePrompt} onCheckedChange={setTranslatePrompt} />
            </div>
          </div>

          {/* 文本框 */}
          <div className="rounded-lg border border-white/10 bg-white/5">
            <div className="p-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="你想要创建什么？"
                className="min-h-[200px] resize-none bg-transparent text-white placeholder:text-white/50"
                maxLength={1000}
              />
            </div>
            <div className="flex items-center justify-between px-3 pb-3">
              <Button variant="secondary" onClick={() => {}} className="h-9 bg-white/10 hover:bg-white/15 border border-white/10 text-white">
                <Wand2 className="w-4 h-4 mr-2" />
                AI提示词
              </Button>
              <div className="flex items-center gap-3 text-xs text-white/60">
                <span>{prompt.length} / 1000</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white" onClick={() => setPrompt("")}>
                  <Trash2 className="w-4 h-4" />
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
      <div className="pt-2 pb-0 shrink-0 border-t border-white/10">
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
        <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-600/90 hover:to-blue-600/90" disabled={!prompt.trim()}>
          创建
        </Button>
        <div className="mt-6 border-t border-white/10" />
      </div>
    </div>
  );
}
