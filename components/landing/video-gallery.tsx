"use client"

import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRef } from "react"
import { useInView } from "react-intersection-observer"

const videos = [
  "https://cdn.bestmaker.ai/tasks/c79eec6b-eb10-4b72-b9fa-f28d7a0e73af/99737affd67f4951913830bd1a821c8b.mp4",
  "https://cdn.bestmaker.ai/tasks/d102f9f6-7f72-4c04-bb1f-14b32c276799/dfc452c511aa4800a6194ef84da6c3a2.mp4",
  "https://cdn.bestmaker.ai/tasks/230db99f-218e-444e-b68f-efc1041ee5c3/fb92412e930e4280b103625ffe06e0d9.mp4",
  "https://cdn.bestmaker.ai/tasks/03b82069-e12e-40c4-9838-a4db084df815/fa157934635543b9885ac86ab73b579a.mp4",
  "https://cdn.bestmaker.ai/tasks/c7a012a6-a557-45e4-af3a-ddc69f7f6b6d/b6c6025f82ad4e1d9c908be29fd82007.mp4",
  "https://cdn.bestmaker.ai/tasks/544ca1c8-6e3b-42ce-bb27-4c02dcfdc1d3/3a0035a91af844008ce1c60e17977106.mp4",
  "https://cdn.bestmaker.ai/tasks/436bd64c-1c9e-4376-833d-dfe7411f5071/2cc1878eedc848d3847959b2979c3065.mp4",
  "https://cdn.bestmaker.ai/tasks/a6b2238c-f36a-4cbd-99e7-33142187f37f/d49a85182db2438096206c3da3486996.mp4",
]

type VideoCardProps = {
  src: string
  index: number
  label: string
  badge: string
}

function VideoCard({ src, index, label, badge }: VideoCardProps) {
  const { ref, inView } = useInView({
    rootMargin: "200px",
  })
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handlePlay = () => {
    videoRef.current?.play().catch(() => null)
  }

  const handlePause = () => {
    videoRef.current?.pause()
  }

  return (
    <div
      ref={ref}
      className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
      onMouseEnter={handlePlay}
      onMouseLeave={handlePause}
      onFocus={handlePlay}
      onBlur={handlePause}
    >
      <video
        src={inView ? src : undefined}
        ref={videoRef}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loop
        muted
        playsInline
        preload="none"
      />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
      <div className="absolute bottom-3 left-3 right-3">
        <div className="text-xs font-medium text-white/90 mb-1">{label} {index + 1}</div>
        <div className="flex items-center gap-1 text-[10px] text-white/70">
          <Play className="w-3 h-3 fill-current" />
          {badge}
        </div>
      </div>
    </div>
  )
}

export function VideoGallery() {
  const t = useTranslations("Landing.VideoGallery")

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("title")}
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {videos.map((src, i) => (
            <VideoCard
              key={src}
              src={src}
              index={i}
              label={t("videoLabel")}
              badge={t("aiGeneratedBadge")}
            />
          ))}
        </div>
        <div className="text-center mt-12">
          <Link href="/text-to-video">
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-medium px-8">
              {t("startBtn")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
