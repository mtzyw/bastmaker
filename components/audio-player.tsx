"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const AUDIO_BUS_EVENT = "sound-player:play";

type AudioPlayerProps = {
  src: string;
  durationSeconds?: number | null;
  className?: string;
  onReady?: () => void;
};

function formatTime(value?: number | null) {
  const safe = Number.isFinite(value ?? NaN) ? Math.max(0, Math.floor(value ?? 0)) : 0;
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function AudioPlayer({
  src,
  durationSeconds,
  className,
  onReady,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(() =>
    Number.isFinite(durationSeconds ?? NaN) ? Number(durationSeconds) : 0
  );

  const progressPercent = useMemo(() => {
    if (!duration || !Number.isFinite(duration) || duration <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    audio.load();

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      const derivedDuration = Number.isFinite(audio.duration) ? audio.duration : durationSeconds ?? 0;
      setDuration(derivedDuration);
      onReady?.();
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);

    if (Number.isFinite(durationSeconds ?? NaN)) {
      setDuration(Number(durationSeconds));
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
    };
  }, [durationSeconds, onReady, src]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const listener = (event: Event) => {
      const custom = event as CustomEvent<HTMLAudioElement | null>;
      const other = custom.detail;
      const current = audioRef.current;
      if (!current || !other || current === other) {
        return;
      }
      current.pause();
    };
    window.addEventListener(AUDIO_BUS_EVENT, listener as EventListener);
    return () => window.removeEventListener(AUDIO_BUS_EVENT, listener as EventListener);
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent<HTMLAudioElement>(AUDIO_BUS_EVENT, { detail: audio }));
      }
    } catch (error) {
      console.error("[audio-player] play failed", error);
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
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

  return (
    <div
      className={cn(
        "flex w-full items-center gap-6 rounded-[32px] border border-white/8 bg-[#1f1f24] px-6 py-4 text-white shadow-[0_10px_30px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[#dc2e5a] shadow-[0_6px_18px_rgba(0,0,0,0.4)]">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#111014]">
          <div className="absolute inset-2 rounded-full border border-white/15" />
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-white/90"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between text-sm font-mono text-white/80">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div
          className="relative h-3 cursor-pointer rounded-full bg-white/10"
          onClick={handleProgressClick}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/80"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 h-4 w-4 -translate-y-1/2 translate-x-[-50%] rounded-full bg-white shadow"
            style={{ left: `${progressPercent}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        aria-label={isPlaying ? "暂停播放" : "播放音效"}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          void togglePlay();
        }}
        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#3b3b45] text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition hover:bg-[#4c4c57] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f1f24]"
      >
        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
      </button>
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" aria-label={src} />
    </div>
  );
}
