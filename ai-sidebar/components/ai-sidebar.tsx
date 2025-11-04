"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { useRouter, usePathname } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { FileText, Search, Type, ImageIcon, Video, Volume2, MessageCircle, Monitor, Folder } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
}

interface MenuSection {
  title?: string
  items: MenuItem[]
}

export function AISidebar({ className, onNavigate }: { className?: string, onNavigate?: () => void }) {
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
        },
        {
          id: "image-to-video",
          label: "图片转视频",
          icon: <ImageIcon className="w-5 h-5" />,
        },
        {
          id: "lip-sync",
          label: "对口型",
          icon: <MessageCircle className="w-5 h-5" />,
        },
        {
          id: "sound-generation",
          label: "音效生成",
          icon: <Volume2 className="w-5 h-5" />,
        },
        {
          id: "image-effects",
          label: "AI图片特效",
          icon: <ImageIcon className="w-5 h-5" />,
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
  const fallbackActiveId = (() => {
    for (const section of menuSections) {
      if (section.items.length) return section.items[0].id
    }
    return ""
  })()

  const pathname = usePathname()

  const normalizePathname = (path?: string | null) => {
    if (!path) return "/"
    const normalized = path.replace(/^\/[a-z]{2}(?=\/|$)/i, "")
    return normalized.length > 0 ? normalized : "/"
  }

  const activeIdFromPath = useMemo(() => {
    const path = normalizePathname(pathname)
    if (path.startsWith("/video-effects")) return "ai-video-effects"
    if (path.startsWith("/image-effects")) return "image-effects"
    if (path.startsWith("/sound-generation")) return "sound-generation"
    if (path.startsWith("/lip-sync")) return "lip-sync"
    if (path.startsWith("/text-to-video")) return "text-to-video"
    if (path.startsWith("/image-to-video")) return "image-to-video"
    if (path.startsWith("/text-to-image")) return "text-to-image"
    if (path.startsWith("/image-to-image")) return "image-to-image"
    if (path.startsWith("/my-creations")) return "assets"
    if (path.startsWith("/explore")) return "explore"
    if (path === "/" || path.startsWith("/creation")) return "creation-center"
    return ""
  }, [pathname])

  const [activeId, setActiveId] = useState<string>(activeIdFromPath || fallbackActiveId)

  useEffect(() => {
    if (activeIdFromPath && activeIdFromPath !== activeId) {
      setActiveId(activeIdFromPath)
    }
  }, [activeIdFromPath, activeId])

  const handleItemClick = (itemId: string) => {
    setActiveId(itemId)
    // Route mapping for relevant items
    if (itemId === "sound-generation") { router.push("/sound-generation"); onNavigate && onNavigate(); }
    if (itemId === "text-to-image") { router.push("/text-to-image"); onNavigate && onNavigate(); }
    if (itemId === "image-to-image") { router.push("/image-to-image"); onNavigate && onNavigate(); }
    if (itemId === "text-to-video") { router.push("/text-to-video"); onNavigate && onNavigate(); }
    if (itemId === "image-to-video") { router.push("/image-to-video"); onNavigate && onNavigate(); }
    if (itemId === "lip-sync") { router.push("/lip-sync"); onNavigate && onNavigate(); }
    if (itemId === "image-effects") { router.push("/image-effects"); onNavigate && onNavigate(); }
    if (itemId === "ai-video-effects") { router.push("/video-effects"); onNavigate && onNavigate(); }
    if (itemId === "assets") { router.push("/my-creations"); onNavigate && onNavigate(); }
  }

  return (
    <div className={cn("w-64 text-white flex flex-col h-full overflow-x-hidden", className ? className : "bg-gray-900") }>
      {/* Scrollable menu content */}
      <ScrollArea className="flex-1">
        <div className="py-7">
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
              <div className="mx-6 mb-5 border-t border-white/10" />
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
            {sectionIndex < menuSections.length - 1 && section.title && (
              <div className="mx-6 mt-5 border-t border-white/10" />
            )}
          </div>
        ))}
        </div>
      </ScrollArea>
      {/* Fixed bottom login */}
      <div className="p-4 border-t border-white/10">
        <Button className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 text-white">登录</Button>
      </div>
    </div>
  )
}
