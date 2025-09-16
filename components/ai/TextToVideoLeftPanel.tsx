"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Adapted from text-to-image-generator UI for use in Section 2 Left (dark bg)
export default function TextToVideoLeftPanel() {
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [outputFormat, setOutputFormat] = useState<"png" | "jpg">("png");
  const [model, setModel] = useState("Nano Banana Free");

  return (
    <div className="w-full h-full min-h-0 text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0">
        <div className="pr-1">
        {/* 顶部标题 + 模型选择 */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">文字转视频</h1>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-48 h-9 bg-white/5 border-white/10 text-white">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-[10px] leading-none font-bold">G</span>
                </div>
                <SelectValue placeholder="选择模型" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nano Banana Free">Nano Banana Free</SelectItem>
              <SelectItem value="Nano Banana Pro">Nano Banana Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 提示词 + 翻译开关 */}
        <div className="flex items-center justify-between mb-2">
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

        {/* 输出格式 */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm">输出格式</div>
            <div className="w-4 h-4 rounded-full border border-white/25 flex items-center justify-center text-[10px] text-white/60">?</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={outputFormat === "png" ? "default" : "outline"}
              onClick={() => setOutputFormat("png")}
              className={
                outputFormat === "png"
                  ? "h-11 bg-blue-600 text-white"
                  : "h-11 bg-white/5 border border-white/10 text-white hover:bg-white/10"
              }
            >
              png
            </Button>
            <Button
              variant={outputFormat === "jpg" ? "default" : "outline"}
              onClick={() => setOutputFormat("jpg")}
              className={
                outputFormat === "jpg"
                  ? "h-11 bg-blue-600 text-white"
                  : "h-11 bg-white/5 border border-white/10 text-white hover:bg-white/10"
              }
            >
              jpg
            </Button>
          </div>
        </div>
        </div>
      </ScrollArea>

      {/* 固定底部按钮；上方内容单独滚动 */}
      <div className="pt-2 pb-5 shrink-0">
        <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-600/90 hover:to-blue-600/90" disabled={!prompt.trim()}>
          创建
        </Button>
      </div>
    </div>
  );
}
