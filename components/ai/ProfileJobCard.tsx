"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Pause, Play, Waves } from "lucide-react";

import { Link as I18nLink } from "@/i18n/routing";
import type { PublicProfileJob, ViewerJobAsset } from "@/actions/ai-jobs/public";

const GRID_ROW_HEIGHT = 12; // matches auto-rows-[12px]
const GRID_GAP = 16; // gap-4 => 1rem
const CARD_AUDIO_EVENT = "profile-card-audio:play";

type ProfileJobCardProps = {
  job: PublicProfileJob;
  locale: string;
};

function buildViewerPath(locale: string, shareSlug: string) {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${prefix}/v/${shareSlug}`;
}

function formatTimeLabel(value?: number | null) {
  const safe = Number.isFinite(value ?? NaN) ? Math.max(0, Math.floor(Number(value ?? 0))) : 0;
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function AudioPreview({ asset }: { asset: ViewerJobAsset }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(() =>
    Number.isFinite(asset.duration ?? NaN) ? Number(asset.duration) : 0
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoaded = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : asset.duration ?? 0;
      setDuration(nextDuration ?? 0);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
    };
  }, [asset.duration, asset.url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(Number.isFinite(asset.duration ?? NaN) ? Number(asset.duration) : 0);
  }, [asset.url, asset.duration]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const listener = (event: Event) => {
      const custom = event as CustomEvent<HTMLAudioElement | null>;
      const other = custom.detail;
      const audio = audioRef.current;
      if (!audio || !other || audio === other) {
        return;
      }
      audio.pause();
    };
    window.addEventListener(CARD_AUDIO_EVENT, listener as EventListener);
    return () => window.removeEventListener(CARD_AUDIO_EVENT, listener as EventListener);
  }, []);

  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const handleTogglePlay = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    try {
      await audio.play();
      setIsPlaying(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent<HTMLAudioElement>(CARD_AUDIO_EVENT, { detail: audio }));
      }
    } catch (error) {
      console.error("[profile-job-card] audio play failed", error);
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !duration || !Number.isFinite(duration)) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const nextTime = Math.min(duration, Math.max(0, ratio * duration));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  if (!asset.url) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-black/40 text-sm text-white/70">
        暂无可播放的音频
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-6 rounded-2xl bg-gradient-to-b from-[#18181f] via-[#12121a] to-[#09090c] p-5 text-white">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <Waves className="h-5 w-5" />
        </span>
        <span className="font-semibold tracking-wide text-sm">音频作品</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={isPlaying ? "暂停音频" : "播放音频"}
          onClick={handleTogglePlay}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#18181f]"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>
        <div className="flex-1">
          <div
            className="h-2 cursor-pointer rounded-full bg-white/15"
            onClick={handleProgressClick}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-white to-white/70"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-white/60">
            <span>{formatTimeLabel(currentTime)}</span>
            <span>{formatTimeLabel(duration)}</span>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={asset.url} preload="metadata" className="hidden" />
    </div>
  );
}

function MediaPreview({ asset }: { asset: ViewerJobAsset }) {
  if (asset.type === "video") {
    return (
      <video
        src={asset.url}
        poster={asset.posterUrl ?? asset.thumbUrl ?? undefined}
        muted
        loop
        playsInline
        className="h-full w-full rounded-xl object-cover"
      />
    );
  }

  if (asset.type === "audio") {
    return <AudioPreview asset={asset} />;
  }

  return (
    <img
      src={asset.url}
      alt={asset.alt ?? "Artwork"}
      className="h-full w-full rounded-xl object-cover"
      loading="lazy"
    />
  );
}

export function ProfileJobCard({ job, locale }: ProfileJobCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [rowSpan, setRowSpan] = useState(1);

  const recalcRowSpan = useCallback(() => {
    const node = cardRef.current;
    const contentNode = contentRef.current;
    if (!node) {
      return;
    }

    const previousGridRowEnd = node.style.gridRowEnd;
    node.style.gridRowEnd = "auto";

    const measuredHeight = (() => {
      if (contentNode) {
        const contentScrollHeight = contentNode.scrollHeight;
        if (Number.isFinite(contentScrollHeight) && contentScrollHeight > 0) {
          return contentScrollHeight;
        }

        const contentRect = contentNode.getBoundingClientRect();
        if (Number.isFinite(contentRect.height) && contentRect.height > 0) {
          return contentRect.height;
        }
      }

      const nodeScrollHeight = node.scrollHeight;
      if (Number.isFinite(nodeScrollHeight) && nodeScrollHeight > 0) {
        return nodeScrollHeight;
      }

      const nodeRect = node.getBoundingClientRect();
      return nodeRect.height;
    })();

    if (!Number.isFinite(measuredHeight) || measuredHeight <= 0) {
      node.style.gridRowEnd = previousGridRowEnd;
      return;
    }

    const span = Math.max(
      1,
      Math.ceil((measuredHeight + GRID_GAP) / (GRID_ROW_HEIGHT + GRID_GAP))
    );
    node.style.gridRowEnd = `span ${span}`;
    setRowSpan(span);
  }, []);

  useEffect(() => {
    const observedNode = contentRef.current ?? cardRef.current;
    if (!observedNode) {
      return;
    }

    recalcRowSpan();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        recalcRowSpan();
      });
      observer.observe(observedNode);
      return () => {
        observer.disconnect();
      };
    }

    const id = window.setTimeout(recalcRowSpan, 100);
    return () => window.clearTimeout(id);
  }, [job, recalcRowSpan]);

  return (
    <div
      ref={cardRef}
      style={{ gridRowEnd: `span ${rowSpan}` }}
      className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
    >
      <I18nLink
        href={buildViewerPath(locale, job.shareSlug)}
        prefetch
        className="group relative flex-grow w-full text-left focus:outline-none"
        aria-label="查看详情"
      >
        <div ref={contentRef} className="relative w-full h-full overflow-hidden rounded-2xl">
            <MediaPreview asset={job.coverAsset} />
            <span className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 bg-black/40 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            查看详情
            </span>
        </div>
      </I18nLink>
    </div>
  );
}
