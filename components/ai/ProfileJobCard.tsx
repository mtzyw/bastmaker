"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link as I18nLink } from "@/i18n/routing";
import type { PublicProfileJob, ViewerJobAsset } from "@/actions/ai-jobs/public";

const GRID_ROW_HEIGHT = 12; // matches auto-rows-[12px]
const GRID_GAP = 16; // gap-4 => 1rem

type ProfileJobCardProps = {
  job: PublicProfileJob;
  locale: string;
};

function buildViewerPath(locale: string, shareSlug: string) {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${prefix}/v/${shareSlug}`;
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
        className="group relative w-full text-left focus:outline-none"
        aria-label="查看详情"
      >
        <div ref={contentRef} className="relative w-full overflow-hidden rounded-2xl">
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
