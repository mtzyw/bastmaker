"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Wand2, Trash2, Coins } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Adapted from text-to-image-generator UI for use in Section 2 Left (dark bg)
type VideoLengthValue = "5" | "6" | "8" | "10";
type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:4";

const aspectPresetsByModel: Record<string, AspectRatio[]> = {
  "Seedance 1.0 Lite": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "Seedance 1.0 Pro": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "Kling v2.1 Master": ["1:1", "16:9", "9:16"],
  "wan2.2 Plus": ["16:9", "9:16", "1:1", "4:3", "3:4"],
  "PixVerse V5": ["16:9", "9:16", "1:1", "4:3", "3:4"],
};

const aspectIconWidthMap: Record<AspectRatio, string> = {
  "16:9": "w-9",
  "9:16": "w-5",
  "1:1": "w-7",
  "4:3": "w-8",
  "3:4": "w-6",
};

const lengthPresetsByModel: Record<string, VideoLengthValue[]> = {
  "Minimax Hailuo 2.0": ["6", "10"],
  "PixVerse V5": ["5", "8"],
  "Seedance 1.0 Lite": ["5", "10"],
  "Seedance 1.0 Pro": ["5", "10"],
};

export default function TextToVideoLeftPanel() {
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState("Minimax Hailuo 2.0");
  const [videoLength, setVideoLength] = useState<VideoLengthValue>("6");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");

  useEffect(() => {
    const allowed = lengthPresetsByModel[model] ?? ["5", "10"];

    if (!allowed.includes(videoLength)) {
      setVideoLength(allowed[0]);
    }
  }, [model, videoLength]);

  useEffect(() => {
    const allowedAspects = aspectPresetsByModel[model];
    if (allowedAspects && !allowedAspects.includes(aspectRatio)) {
      setAspectRatio(allowedAspects.includes("16:9") ? "16:9" : allowedAspects[0]);
    }
  }, [model, aspectRatio]);

  return (
    <div className="w-full h-full min-h-0 text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 -mr-4 md:-mr-6">
        <div className="pr-4 md:pr-6">
          <div className="pr-1">
            {/* 标题 */}
            <h1 className="text-2xl font-semibold mt-2 mb-4 h-11 flex items-center">文字转视频</h1>
            {/* Model 标签 + 选择 */}
            <div className="mb-2 text-sm">Model</div>
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
                  <SelectItem value="Minimax Hailuo 2.0">Minimax Hailuo 2.0</SelectItem>
                  <SelectItem value="Kling v2.1 Master">Kling v2.1 Master</SelectItem>
                  <SelectItem value="Seedance 1.0 Lite">Seedance 1.0 Lite</SelectItem>
                  <SelectItem value="Seedance 1.0 Pro">Seedance 1.0 Pro</SelectItem>
                  <SelectItem value="wan2.2 Plus">wan2.2 Plus</SelectItem>
                  <SelectItem value="PixVerse V5">PixVerse V5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 提示词 + 翻译开关 */}
            <div className="flex items-center justify-between mt-3 mb-2">
              <div className="text-sm">提示词</div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>翻译提示词</span>
                <Switch checked={translatePrompt} onCheckedChange={setTranslatePrompt} />
              </div>
            </div>

            {/* 文本框 */}
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

            {/* 视频时长选择 */}
            <div className="mt-4">
              <div className="text-sm mb-2">Video Length</div>
              <RadioGroup
                value={videoLength}
                onValueChange={(value) => setVideoLength(value as VideoLengthValue)}
                className="flex gap-2"
              >
                {(lengthPresetsByModel[model] ?? ["5", "10"]).map((length) => {
                  const id = `video-length-${length}`;
                  const isActive = videoLength === length;
                  return (
                    <div key={length} className="flex-1 basis-0">
                      <RadioGroupItem value={length} id={id} className="sr-only" />
                      <Label
                        htmlFor={id}
                        className={cn(
                          "flex h-full w-full cursor-pointer select-none rounded-lg border border-white/10 px-3 py-2 text-sm text-center transition-all",
                          isActive
                            ? "bg-pink-500/30 text-white shadow-[0_0_12px_rgba(236,72,153,0.25)] border-white/30"
                            : "bg-white/8 text-white/70 hover:bg-white/12"
                        )}
                      >
                        {length} 秒
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {aspectPresetsByModel[model] && (
              <div className="mt-5">
                <div className="mb-2">
                  <div className="text-sm font-medium text-white">Aspect Ratio</div>
                  <p className="text-xs text-white/60">Choose the appropriate aspect ratio.</p>
                </div>
                <RadioGroup
                  value={aspectRatio}
                  onValueChange={(value) => setAspectRatio(value as AspectRatio)}
                  className="flex gap-2"
                >
                  {aspectPresetsByModel[model]!.map((ratio) => {
                    const ratioId = `aspect-${ratio.replace(":", "-")}`;
                    const isActive = aspectRatio === ratio;
                    return (
                      <div key={ratio} className="flex-1 basis-0">
                        <RadioGroupItem value={ratio} id={ratioId} className="sr-only" />
                        <Label
                          htmlFor={ratioId}
                          className={cn(
                            "flex h-full w-full cursor-pointer select-none rounded-lg border border-white/10 px-2 py-1.5 flex-col items-center gap-1 transition-all",
                            isActive
                              ? "bg-pink-500/30 text-white shadow-[0_0_12px_rgba(236,72,153,0.25)] border-white/30"
                              : "bg-white/8 text-white/70 hover:bg-white/12"
                          )}
                        >
                          <span
                            className={cn(
                              "block h-6 rounded-md transition-colors",
                              aspectIconWidthMap[ratio],
                              isActive ? "bg-pink-400" : "bg-white/20"
                            )}
                          />
                          <span className="text-[10px] font-semibold tracking-wide">{ratio}</span>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            {/* 示例已移除，保持简洁 */}
            {/* 保留与 text-to-image 一致的结构，不含输出格式 */}
          </div>
        </div>
      </ScrollArea>

      {/* 固定底部：Output + Create，与 text-to-image 一致 */}
      <div className="pt-2 pb-0 shrink-0">
        <div className="mb-3 border-t border-white/10 -mx-4 md:-mx-6" />
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
        <div className="mt-6 border-t border-white/10 -mx-4 md:-mx-6" />
      </div>
    </div>
  );
}
