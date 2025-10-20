"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { CreationItem } from "@/lib/ai/creations";
import { cn } from "@/lib/utils";

import {
  getEffectiveStatus,
  getStatusLabel,
  isProcessingStatus,
  isVideoOutput,
} from "@/components/ai/my-creations-helpers";

const GRID_ROW_HEIGHT = 12; // matches auto-rows-[12px]
const GRID_GAP = 16; // gap-4 => 1rem

type MyCreationsCardProps = {
  item: CreationItem;
  onOpen: (item: CreationItem) => void;
  onMeasured?: () => void;
};

export function MyCreationsCard({ item, onOpen, onMeasured }: MyCreationsCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const measurementNotifiedRef = useRef(false);
  const [rowSpan, setRowSpan] = useState(1);

  useEffect(() => {
    measurementNotifiedRef.current = false;
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
  const effectiveStatus = getEffectiveStatus(item);
  const statusLabel = getStatusLabel(effectiveStatus);
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

    if (video) {
      const videoSrc = primaryOutput.url;
      const poster = primaryOutput.thumbUrl ?? undefined;

      if (videoSrc) {
        return (
          <video
            src={videoSrc}
            poster={poster ?? undefined}
            className="h-full w-full rounded-2xl object-cover"
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
            className="h-full w-full rounded-2xl object-cover"
            loading="lazy"
            onLoad={recalcRowSpan}
          />
        );
      }

      return null;
    }

    const imageSrc = primaryOutput.url ?? primaryOutput.thumbUrl ?? null;
    if (!imageSrc) {
      return null;
    }

    return (
      <img
        src={imageSrc}
        alt="生成结果"
        className="h-full w-full rounded-2xl object-cover"
        loading="lazy"
        onLoad={recalcRowSpan}
      />
    );
  }, [primaryOutput, video, recalcRowSpan]);

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

  return (
    <div
      ref={cardRef}
      style={{ gridRowEnd: `span ${rowSpan}` }}
      className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
    >
      {canOpenViewer ? (
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="group relative w-full flex-grow text-left focus:outline-none"
          aria-label="查看详情"
        >
          {renderContentWrapper(
            <>
              {contentNode}
              <span className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 bg-black/40 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                查看详情
              </span>
            </>
          )}
        </button>
      ) : (
        renderContentWrapper(contentNode, "flex-grow")
      )}
    </div>
  );
}
