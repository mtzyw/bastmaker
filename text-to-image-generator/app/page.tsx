"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wand2, Trash2 } from "lucide-react"

export default function TextToImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [outputFormat, setOutputFormat] = useState("png")
  const [model, setModel] = useState("Nano Banana Free")

  const handleGenerate = () => {
    console.log("生成图片:", { prompt, outputFormat, model })
    // 这里可以添加实际的图片生成逻辑
  }

  const handleClearPrompt = () => {
    setPrompt("")
  }

  const handleAIPrompt = () => {
    // 这里可以添加AI提示词生成逻辑
    console.log("生成AI提示词")
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 标题和模型选择 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">文字转图片</h1>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-48 bg-muted border-border">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">G</span>
                </div>
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nano Banana Free">Nano Banana Free</SelectItem>
              <SelectItem value="Nano Banana Pro">Nano Banana Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 提示词区域 */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">提示词</h2>

          {/* 文本输入区域 */}
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="你想要创建什么？"
              className="min-h-[200px] bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
              maxLength={1000}
            />
            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">{prompt.length} / 1000</div>
          </div>

          {/* AI提示词按钮 */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleAIPrompt} className="bg-muted border-border hover:bg-accent">
              <Wand2 className="w-4 h-4 mr-2" />
              AI提示词
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearPrompt}
              className="text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* 示例 */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">示例：</span> Wildflower Trail Dolphin Shadow Butterfly Closeup
          </div>
        </div>

        {/* 输出格式 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-foreground">输出格式</h3>
            <div className="w-4 h-4 rounded-full border border-muted-foreground flex items-center justify-center">
              <span className="text-xs text-muted-foreground">?</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={outputFormat === "png" ? "default" : "outline"}
              onClick={() => setOutputFormat("png")}
              className={`h-12 ${
                outputFormat === "png"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted border-border text-foreground hover:bg-accent"
              }`}
            >
              png
            </Button>
            <Button
              variant={outputFormat === "jpg" ? "default" : "outline"}
              onClick={() => setOutputFormat("jpg")}
              className={`h-12 ${
                outputFormat === "jpg"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted border-border text-foreground hover:bg-accent"
              }`}
            >
              jpg
            </Button>
          </div>
        </div>

        {/* 创建按钮 */}
        <Button
          onClick={handleGenerate}
          className="w-full h-12 bg-muted text-foreground hover:bg-accent border border-border"
          disabled={!prompt.trim()}
        >
          创建
        </Button>
      </div>
    </div>
  )
}
