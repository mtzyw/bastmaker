"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Trash2, Coins, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Adapted from text-to-image-generator UI for use in Section 2 Left (dark bg)
export default function TextToVideoLeftPanel() {
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState("Minimax Hailuo 2.0");
  const [seedanceVersion, setSeedanceVersion] = useState<"lite" | "pro">("pro");

  // Seedance variants reverted; using single entry again.

  return (
    <div className="w-full h-full min-h-0 text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0">
        <div className="pr-1">
        {/* 标题 */}
        <h1 className="text-2xl font-semibold mb-4">文字转视频</h1>
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
              <SelectItem value="Seedance">Seedance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seedance model version cards */}
        {model === "Seedance" && (
          <div className="mt-3">
            <div className="text-xs text-white/80 mb-2">Model Version</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Lite */}
              <button
                type="button"
                onClick={() => setSeedanceVersion("lite")}
                className={`relative text-left rounded-lg border transition-colors p-3 bg-white/5 ${
                  seedanceVersion === "lite" ? "border-white/20" : "border-white/10 hover:border-white/15"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center text-white text-sm font-semibold">S</div>
                  <div className="text-sm font-semibold">Seedance 1.0 Lite</div>
                  <div className="text-xs text-white/70">Accurate motion and camera control</div>
                </div>
                {seedanceVersion === "lite" && (
                  <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-emerald-400" />
                )}
              </button>

              {/* Pro */}
              <button
                type="button"
                onClick={() => setSeedanceVersion("pro")}
                className={`relative text-left rounded-lg border transition-colors p-3 bg-white/5 ${
                  seedanceVersion === "pro" ? "border-white/20" : "border-white/10 hover:border-white/15"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center text-white text-sm font-semibold">S</div>
                  <div className="text-sm font-semibold">Seedance 1.0 Pro</div>
                  <div className="text-xs text-white/70">Fluid, cohesive multi-shot video outputs</div>
                </div>
                {seedanceVersion === "pro" && (
                  <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-emerald-400" />
                )}
              </button>
            </div>
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

        {/* 示例已移除，保持简洁 */}
        {/* 保留与 text-to-image 一致的结构，不含输出格式 */}
        </div>
      </ScrollArea>

      {/* 固定底部：Output + Create，与 text-to-image 一致 */}
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
          创建
        </Button>
      </div>
    </div>
  );
}
