"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { CreationItem } from "@/lib/ai/creations";
import { cn } from "@/lib/utils";

import {
  getEffectiveStatus,
  isAudioOutput,
  isProcessingStatus,
  isVideoOutput,
} from "@/components/ai/my-creations-helpers";
import AudioPlayer from "@components/audio-player";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Copy, Crown, Download, Menu, Trash2 } from "lucide-react";

const GRID_ROW_HEIGHT = 12; // matches auto-rows-[12px]
const GRID_GAP = 16; // gap-4 => 1rem

export type DownloadVariant = "watermark" | "clean";

type MyCreationsCardProps = {
  item: CreationItem;
  onOpen: (item: CreationItem) => void;
  onMeasured?: () => void;
  onDownload?: (variant: DownloadVariant) => void;
  onCopyLink?: () => void;
  onDelete?: () => void;
  downloadAvailability?: {
    watermark: boolean;
    clean: boolean;
  };
  canCopyLink?: boolean;
  actionsDisabled?: boolean;
};

export function MyCreationsCard({
  item,
  onOpen,
  onMeasured,
  onDownload,
  onCopyLink,
  onDelete,
  downloadAvailability,
  canCopyLink = false,
  actionsDisabled = false,
}: MyCreationsCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuContentRef = useRef<HTMLDivElement | null>(null);
  const measurementNotifiedRef = useRef(false);
  const [isMeasured, setIsMeasured] = useState(false);
  const [rowSpan, setRowSpan] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [downloadExpanded, setDownloadExpanded] = useState(false);
  const historyT = useTranslations("CreationHistory");

  useEffect(() => {
    measurementNotifiedRef.current = false;
    setIsMeasured(false);
    setIsMenuOpen(false);
  }, [item.jobId]);

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
    setIsMeasured(true);

    if (!measurementNotifiedRef.current) {
      measurementNotifiedRef.current = true;
      onMeasured?.();
    }
  }, [onMeasured]);

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
  }, [item, recalcRowSpan]);

  const [primaryOutput] = item.outputs;
  const video = isVideoOutput(primaryOutput);
  const audio = isAudioOutput(primaryOutput);
  const effectiveStatus = getEffectiveStatus(item);
  const statusLabel = effectiveStatus ? historyT(`status.${effectiveStatus}`) : historyT("status.unknown");
  const isInProgress = isProcessingStatus(effectiveStatus);
  const isError =
    effectiveStatus === "failed" ||
    effectiveStatus === "cancelled" ||
    effectiveStatus === "cancelled_insufficient_credits";
  const canOpenViewer = effectiveStatus === "completed" && Boolean(item.shareSlug);

  const mediaContent = useMemo(() => {
    if (!primaryOutput) {
      return null;
    }

    const mediaClassName = cn("w-full rounded-2xl object-cover", isMeasured && "h-full");

    if (video) {
      const videoSrc = primaryOutput.url;
      const poster = primaryOutput.thumbUrl ?? undefined;

      if (videoSrc) {
        return (
          <video
            src={videoSrc}
            poster={poster ?? undefined}
            className={mediaClassName}
            playsInline
            muted
            loop
            preload="metadata"
            controls
            onLoadedMetadata={recalcRowSpan}
            onLoadedData={recalcRowSpan}
          />
        );
      }

      if (poster) {
        return (
          <img
            src={poster}
            alt="生成结果"
            className={mediaClassName}
            loading="lazy"
            onLoad={recalcRowSpan}
          />
        );
      }

      return null;
    }

    if (audio) {
      if (!primaryOutput.url) {
        return null;
      }

      const durationFromOutput = Number.isFinite(primaryOutput.durationSeconds ?? NaN)
        ? Number(primaryOutput.durationSeconds)
        : undefined;
      const fallbackDuration = Number.isFinite(item.metadata?.duration_seconds ?? NaN)
        ? Number(item.metadata?.duration_seconds)
        : undefined;

      return (
        <AudioPlayer
          src={primaryOutput.url}
          durationSeconds={durationFromOutput ?? fallbackDuration}
          className="w-full"
          onReady={recalcRowSpan}
        />
      );
    }

    const imageSrc = primaryOutput.url ?? primaryOutput.thumbUrl ?? null;
    if (!imageSrc) {
      return null;
    }

    return (
      <img
        src={imageSrc}
        alt="生成结果"
        className={mediaClassName}
        loading="lazy"
        onLoad={recalcRowSpan}
      />
    );
  }, [
    primaryOutput,
    video,
    audio,
    recalcRowSpan,
    isMeasured,
    item.metadata?.duration_seconds,
  ]);

  const fallbackContent = (
    <div className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-white/10 to-white/5 py-16">
      {isInProgress ? (
        <>
          <span className="block h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white/80" />
          <span className="mt-3 text-[13px] text-white/70">{statusLabel}</span>
        </>
      ) : (
        <span
          className={cn(
            "rounded-md px-3 py-1 text-sm",
            isError ? "bg-rose-500/15 text-rose-100" : "bg-white/15 text-white/80"
          )}
        >
          {statusLabel}
        </span>
      )}
    </div>
  );

  const contentNode = mediaContent ?? fallbackContent;

  const renderContentWrapper = (children: ReactNode, className?: string) => (
    <div ref={contentRef} className={cn("relative w-full overflow-hidden rounded-2xl h-full", className)}>
      {children}
    </div>
  );

  const downloadLabel = historyT("viewer.download");
  const downloadWatermarkLabel = historyT("actions.downloadWatermark");
  const downloadCleanLabel = historyT("actions.downloadClean");
  const copyLinkLabel = historyT("actions.copyLink");
  const deleteLabel = historyT("actions.delete");
  const moreActionsLabel = historyT("actions.more");

  const canDownloadWatermark = Boolean(onDownload && downloadAvailability?.watermark);
  const canDownloadClean = Boolean(onDownload && downloadAvailability?.clean);
  const hasDownloadOption = canDownloadWatermark || canDownloadClean;
  const showActionsButton =
    !actionsDisabled && (hasDownloadOption || (onCopyLink && canCopyLink) || Boolean(onDelete));

  const handleMenuTriggerPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        menuButtonRef.current?.contains(target) ||
        menuContentRef.current?.contains(target)
      ) {
        return;
      }
      setIsMenuOpen(false);
      setDownloadExpanded(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setDownloadExpanded(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <div
      ref={cardRef}
      style={{ gridRowEnd: `span ${rowSpan}` }}
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
    >
      {canOpenViewer ? (
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="relative w-full flex-grow text-left focus:outline-none"
          aria-label={historyT("viewer.previewAlt")}
        >
          {renderContentWrapper(contentNode)}
        </button>
      ) : (
        renderContentWrapper(contentNode, "flex-grow")
      )}

      {showActionsButton ? (
        <div className="pointer-events-none absolute bottom-2 right-2">
          <Button
            ref={menuButtonRef}
            type="button"
            variant="secondary"
            size="icon"
            className="pointer-events-auto h-8 w-8 rounded-full border border-white/20 bg-black/40 text-white/80 shadow-[0_5px_15px_rgba(0,0,0,0.45)]"
            aria-label={moreActionsLabel}
            onPointerDown={handleMenuTriggerPointerDown}
            onClick={(event) => {
              event.stopPropagation();
              setIsMenuOpen((prev) => !prev);
              setDownloadExpanded(false);
            }}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div
            ref={menuContentRef}
            className={cn(
              "pointer-events-auto absolute bottom-12 right-0 w-44 rounded-2xl border border-white/10 bg-[#1c1c1a] px-2 py-2 text-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.55)] transition",
              isMenuOpen ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-1"
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={cn(
                "relative rounded-xl px-2 py-1.5 text-xs text-white/70",
                !hasDownloadOption && "text-white/30"
              )}
              onMouseEnter={() => hasDownloadOption && setDownloadExpanded(true)}
              onMouseLeave={() => setDownloadExpanded(false)}
              onFocusCapture={() => hasDownloadOption && setDownloadExpanded(true)}
              onBlurCapture={() => setDownloadExpanded(false)}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                <span className="flex-1 text-left">{downloadLabel}</span>
              </button>
              {hasDownloadOption ? (
                <div
                  className={cn(
                    "absolute right-full top-1 mr-2 w-40 rounded-2xl border border-white/10 bg-[#111] px-2 py-2 text-white/80 shadow-[0_10px_25px_rgba(0,0,0,0.45)] transition",
                    downloadExpanded ? "pointer-events-auto opacity-100 translate-x-0" : "pointer-events-none opacity-0 translate-x-1"
                  )}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-[11px] hover:bg-white/10"
                    onClick={() => {
                      onDownload?.("watermark");
                      setIsMenuOpen(false);
                      setDownloadExpanded(false);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    <span className="flex-1">{downloadWatermarkLabel}</span>
                  </button>
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1 text-[11px] hover:bg-white/10"
                    onClick={() => {
                      onDownload?.("clean");
                      setIsMenuOpen(false);
                      setDownloadExpanded(false);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    <span className="flex-1">{downloadCleanLabel}</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#dc2e5a]/20">
                      <Crown className="h-3 w-3 text-[#ffba49]" />
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
            {onCopyLink && canCopyLink ? (
              <button
                type="button"
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-xs text-white/70 hover:bg-white/10"
                onClick={() => {
                  onCopyLink();
                  setIsMenuOpen(false);
                  setDownloadExpanded(false);
                }}
              >
                <Copy className="h-4 w-4" />
                <span className="flex-1">{copyLinkLabel}</span>
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-xs text-white/70 hover:bg-white/10"
                onClick={() => {
                  onDelete();
                  setIsMenuOpen(false);
                  setDownloadExpanded(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="flex-1">{deleteLabel}</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
