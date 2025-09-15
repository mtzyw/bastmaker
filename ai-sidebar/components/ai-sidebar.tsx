"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { FileText, Search, Type, ImageIcon, Video, Volume2, MessageCircle, Monitor, Folder } from "lucide-react"
import { cn } from "@/lib/utils"

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  isActive?: boolean
}

interface MenuSection {
  title?: string
  items: MenuItem[]
}

export function AISidebar({ className }: { className?: string }) {
  const router = useRouter()

  const menuSections: MenuSection[] = [
    {
      items: [
        {
          id: "creation-center",
          label: "创作中心",
          icon: <FileText className="w-5 h-5" />,
        },
        {
          id: "explore",
          label: "探索",
          icon: <Search className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "视频AI",
      items: [
        {
          id: "text-to-video",
          label: "文字转视频",
          icon: <Type className="w-5 h-5" />,
          isActive: true,
        },
        {
          id: "image-to-video",
          label: "图片转视频",
          icon: <ImageIcon className="w-5 h-5" />,
        },
        {
          id: "video-editing",
          label: "视频编辑",
          icon: <Video className="w-5 h-5" />,
        },
        {
          id: "sound-generation",
          label: "音效生成",
          icon: <Volume2 className="w-5 h-5" />,
        },
        {
          id: "lip-sync",
          label: "对口型",
          icon: <MessageCircle className="w-5 h-5" />,
        },
        {
          id: "ai-video-effects",
          label: "AI视频特效",
          icon: <Monitor className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "图片AI",
      items: [
        {
          id: "text-to-image",
          label: "文字转图片",
          icon: <Type className="w-5 h-5" />,
          isActive: true,
        },
        {
          id: "image-to-image",
          label: "图片转图片",
          icon: <ImageIcon className="w-5 h-5" />,
        },
      ],
    },
    {
      items: [
        {
          id: "assets",
          label: "资产",
          icon: <Folder className="w-5 h-5" />,
        },
      ],
    },
  ]

  // Determine initial active item: prefer the first item with isActive, else the first item overall
  const initialActiveId = (() => {
    for (const section of menuSections) {
      const found = section.items.find((it) => it.isActive)
      if (found) return found.id
    }
    for (const section of menuSections) {
      if (section.items.length) return section.items[0].id
    }
    return ""
  })()

  const [activeId, setActiveId] = useState<string>(initialActiveId)

  const handleItemClick = (itemId: string) => {
    setActiveId(itemId)
    // Route mapping for relevant items
    if (itemId === "text-to-image") router.push("/text-to-image")
    if (itemId === "image-to-image") router.push("/image-to-image")
    if (itemId === "text-to-video") router.push("/text-to-video")
    if (itemId === "image-to-video") router.push("/image-to-video")
  }

  return (
    <div className={cn("w-64 text-white flex flex-col h-full overflow-x-hidden", className ? className : "bg-gray-900") }>
      {/* Sidebar Content */}
      <div className="flex-1 py-7">
        {menuSections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className={cn(
              "mb-7",
              section.items.some((it) => it.id === "assets") && "mt-4",
              sectionIndex === 0 && "mt-6"
            )}
          >
            {/* Top divider before first titled section (e.g., 视频AI) */}
            {section.title && sectionIndex > 0 && !menuSections[sectionIndex - 1].title && (
              <div className="mx-6 mb-5 border-t border-gray-700" />
            )}
            {section.title && (
              <div className="px-6 mb-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{section.title}</h3>
              </div>
            )}
            <nav className={cn(
              section.title === "图片AI" || section.title === "视频AI"
                ? "space-y-1"
                : "space-y-2"
            )}>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={cn(
                    "w-full flex items-center px-6 py-3 text-left text-sm font-medium transition-colors duration-200 relative",
                    activeId === item.id
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white",
                  )}
                >
                  <span className="mr-3 flex-shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                  {activeId === item.id && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500" />
                  )}
                </button>
              ))}
            </nav>
            {/* Inline login button directly under the Assets section */}
            {section.items.some((it) => it.id === "assets") && (
              <div className="px-6 mt-4">
                <Button className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 text-white">登录</Button>
              </div>
            )}
            {sectionIndex < menuSections.length - 1 && section.title && (
              <div className="mx-6 mt-5 border-t border-gray-700" />
            )}
          </div>
        ))}
      </div>

      {/* Bottom CTA removed to avoid duplicate login button */}
    </div>
  )
}
