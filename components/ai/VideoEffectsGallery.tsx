"use client";

import { useRef } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { VideoEffectDefinition } from "@/lib/video-effects/effects";
import { VIDEO_EFFECTS } from "@/lib/video-effects/effects";
import { Link } from "@/i18n/routing";

const PREVIEW_VIDEO_URL =
  "https://cdn.bestmaker.ai/tasks/10a81006-480e-4ccf-ba60-c9887e2be6f8/0.mp4";

function VideoEffectCard({ effect }: { effect: VideoEffectDefinition }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleHoverStart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => {
      /* ignore play interruptions */
    });
  };

  const handleHoverEnd = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  return (
    <Link
      href={`/video-effects/${effect.slug}`}
      className="group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      onFocus={handleHoverStart}
      onBlur={handleHoverEnd}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm transition duration-300 group-hover:border-white/30 group-hover:shadow-lg group-hover:shadow-blue-500/20">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={PREVIEW_VIDEO_URL}
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 flex items-start justify-start p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-900 shadow-lg">
            Use This Effect
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-white">{effect.title}</p>
    </Link>
  );
}

export default function VideoEffectsGallery() {
  return (
    <div className="flex h-full flex-col">
      <header className="mb-8 space-y-2">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          Free 100+ AI Video Templates and Effects
        </h2>
        <p className="text-sm text-white/60">
          Pick any template to instantly apply camera moves, lighting presets, and facial expressions.
        </p>
      </header>

      <ScrollArea className="flex-1">
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {VIDEO_EFFECTS.map((effect) => (
            <VideoEffectCard key={effect.slug} effect={effect} />
          ))}
        </div>
        <div className="h-10" />
      </ScrollArea>
    </div>
  );
}
