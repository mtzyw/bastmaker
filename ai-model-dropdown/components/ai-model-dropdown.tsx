"use client"

import { useState } from "react"
import { Search, Clock, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIModel {
  id: string
  name: string
  description: string
  duration: string
  credits: string
  badge?: "new" | "hot"
  icon: string
}

const models: AIModel[] = [
  {
    id: "google-veo-3",
    name: "Google Veo 3 快速",
    description: "比标准 Veo 3 型号快 30%",
    duration: "",
    credits: "",
    icon: "🔍",
  },
  {
    id: "wan-2-2-plus",
    name: "Wan 2.2 Plus",
    description: "逼真的渲染和增强的质量",
    duration: "5 分钟",
    credits: "5+ 学分",
    badge: "new",
    icon: "✨",
  },
  {
    id: "hailuo-02",
    name: "海螺02",
    description: "极端物理模拟",
    duration: "60 秒",
    credits: "20+ 学分",
    badge: "hot",
    icon: "🌊",
  },
  {
    id: "pixverse-v5",
    name: "Pixverse V5",
    description: "流畅、富有表现力的动作",
    duration: "2 分钟",
    credits: "5+ 学分",
    badge: "new",
    icon: "🎬",
  },
  {
    id: "kelin-2-0",
    name: "克林 2.0",
    description: "更好的运动动态和美观度",
    duration: "8 分钟",
    credits: "100+ 学分",
    icon: "⚡",
  },
  {
    id: "seedance-lite",
    name: "Seedance 1.0 Lite",
    description: "快速生成和精确运动",
    duration: "60 秒",
    credits: "5+ 学分",
    icon: "📊",
  },
  {
    id: "seedance-pro",
    name: "Seedance 1.0 专业版",
    description: "专业级视频生成",
    duration: "3 分钟",
    credits: "15+ 学分",
    icon: "📊",
  },
]

export function AIModelDropdown() {
  const [selectedModel, setSelectedModel] = useState<string>("google-veo-3")
  const [isOpen, setIsOpen] = useState(true)

  const selectedModelData = models.find((model) => model.id === selectedModel)

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-4 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-red-500 via-yellow-500 to-green-500 flex items-center justify-center text-white font-bold text-sm">
            G
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{selectedModelData?.name || "Google Veo 3 快速"}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedModelData?.description || "比标准 Veo 3 型号快 30%"}
            </p>
          </div>
        </div>
        <Search className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {models.map((model, index) => (
            <div key={model.id}>
              <div
                className={cn(
                  "p-4 flex items-center gap-3 cursor-pointer hover:bg-accent/50 transition-colors",
                  selectedModel === model.id && "bg-accent/30",
                )}
                onClick={() => setSelectedModel(model.id)}
              >
                {/* Radio Button */}
                <div className="relative">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 border-muted-foreground flex items-center justify-center",
                      selectedModel === model.id && "border-primary",
                    )}
                  >
                    {selectedModel === model.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{model.icon}</span>
                    <h3 className="font-semibold text-foreground">{model.name}</h3>
                    {model.badge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          model.badge === "new" && "bg-green-500 text-white",
                          model.badge === "hot" && "bg-red-500 text-white",
                        )}
                      >
                        {model.badge === "new" ? "新的" : "热的"}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">{model.description}</p>

                  {model.duration && model.credits && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {model.duration}
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                        <GraduationCap className="w-3 h-3" />
                        {model.credits}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {index < models.length - 1 && <div className="border-b border-border/50" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
