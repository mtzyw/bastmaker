"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Trash2, Coins } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Adapted from text-to-image-generator UI for use in Section 2 Left (dark bg)
type VideoLengthValue = "5" | "6" | "8" | "10";
type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
type VideoResolutionValue = "360p" | "480p" | "540p" | "580p" | "720p" | "768p" | "1080p";

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
  "PixVerse V5": ["5", "8"],
  "Seedance 1.0 Lite": ["5", "10"],
  "Seedance 1.0 Pro": ["5", "10"],
  "wan2.2 Plus": ["5", "10"],
};

const resolutionPresetsByModel: Record<string, VideoResolutionValue[]> = {
  "Minimax Hailuo 2.0": ["768p", "1080p"],
  "PixVerse V5": ["360p", "540p", "720p", "1080p"],
  "Seedance 1.0 Lite": ["480p", "720p", "1080p"],
  "Seedance 1.0 Pro": ["480p", "720p", "1080p"],
  "wan2.2 Plus": ["480p", "580p", "720p"],
};

const getAllowedVideoLengths = (
  model: string,
  resolution: VideoResolutionValue
): VideoLengthValue[] => {
  if (model === "Minimax Hailuo 2.0") {
    if (resolution === "1080p") {
      return ["6"];
    }

    if (resolution === "768p") {
      return ["6", "10"];
    }

    return ["6"];
  }

  return lengthPresetsByModel[model] ?? ["5", "10"];
};

const defaultModel = "Minimax Hailuo 2.0";
const defaultResolution = (resolutionPresetsByModel[defaultModel] ?? ["720p"])[0];
const defaultVideoLength = getAllowedVideoLengths(defaultModel, defaultResolution)[0];

export default function TextToVideoLeftPanel() {
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState(defaultModel);
  const [videoLength, setVideoLength] = useState<VideoLengthValue>(defaultVideoLength);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [resolution, setResolution] = useState<VideoResolutionValue>(defaultResolution);

  useEffect(() => {
    if (!resolution) {
      return;
    }

    const allowed = getAllowedVideoLengths(model, resolution);

    if (!allowed.includes(videoLength)) {
      setVideoLength(allowed[0]);
    }
  }, [model, resolution, videoLength]);

  useEffect(() => {
    const allowedAspects = aspectPresetsByModel[model];
    if (allowedAspects && !allowedAspects.includes(aspectRatio)) {
      setAspectRatio(allowedAspects.includes("16:9") ? "16:9" : allowedAspects[0]);
    }
  }, [model, aspectRatio]);

  useEffect(() => {
    const allowedResolutions = resolutionPresetsByModel[model];
    if (!allowedResolutions || allowedResolutions.length === 0) {
      return;
    }

    if (!allowedResolutions.includes(resolution)) {
      setResolution(allowedResolutions[0]);
    }
  }, [model, resolution]);

  const allowedVideoLengths = getAllowedVideoLengths(model, resolution);
  const isSingleVideoLength = allowedVideoLengths.length === 1;
  const resolutionOptions = resolutionPresetsByModel[model];

  return (
    <div className="w-full h-full text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]">
        <div className="pt-3 pb-6 pr-1 md:pr-7">
          <h1 className="text-2xl font-semibold mb-4 h-11 flex items-center">文字转视频</h1>
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

          {aspectPresetsByModel[model] && (
            <div className="mt-5">
              <div className="mb-2">
                <div className="text-sm font-medium text-white">Aspect Ratio</div>
                <p className="text-xs text-white/60">Choose the appropriate aspect ratio.</p>
              </div>
              <div role="radiogroup" aria-label="Aspect Ratio" className="flex gap-2">
                {aspectPresetsByModel[model]!.map((ratio) => {
                  const isActive = aspectRatio === ratio;
                  return (
                    <div key={ratio} className="flex-1 basis-0">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setAspectRatio(ratio)}
                        className={cn(
                          "flex h-full w-full flex-col items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 transition-all bg-white/8 text-white/70 hover:bg-white/12",
                          isActive && "text-white"
                        )}
                      >
                        <span
                          className={cn(
                            "block h-6 rounded-md transition-colors",
                            aspectIconWidthMap[ratio],
                            isActive ? "bg-[#dc2e5a]" : "bg-white/20"
                          )}
                        />
                        <span
                          className={cn(
                            "text-[10px] font-semibold tracking-wide transition-colors",
                            isActive ? "text-white" : "text-white/70"
                          )}
                        >
                          {ratio}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 示例已移除，保持简洁 */}
          {/* 保留与 text-to-image 一致的结构，不含输出格式 */}
        </div>
      </ScrollArea>

      {/* 固定底部：Output + Create，与 text-to-image 一致 */}
      <div className="pt-2 pb-0 shrink-0 border-t border-white/10">
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
        <div className="mt-6 border-t border-white/10" />
      </div>
    </div>
  );
}
