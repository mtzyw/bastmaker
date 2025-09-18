"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Coins, Sparkles, Trash2, Wand2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type VideoLengthValue = "5" | "6" | "10";

export default function ImageToVideoLeftPanel() {
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState("Minimax Hailuo 2.0");
  const [videoLength, setVideoLength] = useState<VideoLengthValue>("6");

  useEffect(() => {
    const nextAllowed: VideoLengthValue[] =
      model === "Minimax Hailuo 2.0" ? ["6"] : ["5", "10"];

    if (!nextAllowed.includes(videoLength)) {
      setVideoLength(nextAllowed[0]);
    }
  }, [model, videoLength]);

  return (
    <div className="w-full h-full min-h-0 text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 -mr-4 md:-mr-6">
        <div className="pr-4 md:pr-6">
          <div className="pr-1">
            <h1 className="text-2xl font-semibold mt-2 mb-4 h-11 flex items-center">图转视频</h1>

            {/* Model label + select */}
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
                  <SelectItem value="Seedance">Seedance</SelectItem>
                  <SelectItem value="PixVerse V5">PixVerse V5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prompt */}
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

            <div className="mt-4">
              <div className="text-sm mb-2">Video Length</div>
              <RadioGroup
                value={videoLength}
                onValueChange={(value) => setVideoLength(value as VideoLengthValue)}
                className="flex gap-2"
              >
                {(model === "Minimax Hailuo 2.0" ? ["6"] : ["5", "10"]).map((length) => {
                  const id = `image-video-length-${length}`;
                  const isActive = videoLength === length;
                  return (
                    <div key={length} className="flex-1 basis-0">
                      <RadioGroupItem value={length} id={id} className="sr-only" />
                      <Label
                        htmlFor={id}
                        className={`flex h-full w-full cursor-pointer select-none rounded-lg border border-white/10 px-3 py-2 text-sm text-center transition-all ${
                          isActive
                            ? "bg-pink-500/30 text-white shadow-[0_0_12px_rgba(236,72,153,0.25)] border-white/30"
                            : "bg-white/8 text-white/70 hover:bg-white/12"
                        }`}
                      >
                        {length} 秒{model === "Minimax Hailuo 2.0" && length === "6" ? "（固定）" : ""}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

          </div>
        </div>
      </ScrollArea>

      {/* Fixed bottom: Output + Create */}
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
          <Sparkles className="w-4 h-4 mr-2" />
          创建
        </Button>
        <div className="mt-6 border-t border-white/10 -mx-4 md:-mx-6" />
      </div>
    </div>
  );
}
