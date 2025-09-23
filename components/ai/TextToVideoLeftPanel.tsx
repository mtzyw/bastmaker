"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Wand2, Trash2, Coins } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AIModelDropdown } from "@/components/ai/AIModelDropdown";
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

export default function TextToVideoLeftPanel() {
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
    const allowedAspects = VIDEO_ASPECT_PRESETS[model] ?? [FALLBACK_ASPECT_RATIO];
    if (!allowedAspects.includes(aspectRatio)) {
      setAspectRatio(allowedAspects.includes(FALLBACK_ASPECT_RATIO)
        ? FALLBACK_ASPECT_RATIO
        : allowedAspects[0]);
    }
  }, [model, aspectRatio]);

  useEffect(() => {
    const allowedResolutions = VIDEO_RESOLUTION_PRESETS[model] ?? [FALLBACK_RESOLUTION];
    if (!allowedResolutions.includes(resolution)) {
      setResolution(allowedResolutions[0]);
    }
  }, [model, resolution]);

  const allowedVideoLengths = getAllowedVideoLengths(model, resolution);
  const isSingleVideoLength = allowedVideoLengths.length === 1;
  const resolutionOptions = VIDEO_RESOLUTION_PRESETS[model] ?? [FALLBACK_RESOLUTION];
  const aspectOptions = VIDEO_ASPECT_PRESETS[model] ?? [FALLBACK_ASPECT_RATIO];

  return (
    <div className="w-full h-full text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]">
        <div className="pt-3 pb-6 pr-1 md:pr-7">
          <h1 className="text-2xl font-semibold mb-4 h-11 flex items-center">文字转视频</h1>
          <div className="mb-2 text-sm">Model</div>
          <div className="mb-4">
            <AIModelDropdown
              options={VIDEO_MODEL_SELECT_OPTIONS}
              value={model}
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
