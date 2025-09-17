"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Sparkles, Trash2, Wand2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ImageToVideoLeftPanel() {
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState("Minimax Hailuo 2.0");

  return (
    <div className="w-full h-full min-h-0 text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0">
        <div className="pr-1">
          <h1 className="text-2xl font-semibold mb-4">图转视频</h1>

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
          <div className="rounded-lg border border-white/10 bg-white/5">
            <div className="p-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="你想要创建什么？"
                className="min-h-[180px] resize-none bg-transparent text-white placeholder:text-white/50"
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
            <span className="">示例：</span> A bird flying through a neon city at night
          </div>
        </div>
      </ScrollArea>

      {/* Fixed bottom: Output + Create */}
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
        <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-600/90 hover:to-blue-600/90" disabled={!prompt.trim()}>
          <Sparkles className="w-4 h-4 mr-2" />
          Create
        </Button>
      </div>
    </div>
  );
}
