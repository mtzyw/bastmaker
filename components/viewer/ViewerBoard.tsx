"use client";

import dayjs from "dayjs";
import Image from "next/image";
import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Heart,
  Link as LinkIcon,
  Share as ShareIcon,
  MoreHorizontal,
  Copy,
  Video,
  ImageIcon,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import type { ViewerJob, ViewerJobAsset } from "@/actions/ai-jobs/public";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const DATE_FORMAT = "YYYY-MM-DD HH:mm";

type ViewerBoardProps = {
  job: ViewerJob;
  shareUrl: string;
};

function getPrimaryAsset(assets: ViewerJobAsset[], fallbackUrl: string | null) {
  if (assets.length > 0) {
    return assets[0];
  }
  if (fallbackUrl) {
    return {
      type: "image" as const,
      url: fallbackUrl,
      width: null,
      height: null,
    };
  }
  return null;
}

function getPreviewAsset(assets: ViewerJobAsset[]) {
  if (assets.length > 1) {
    return assets[1];
  }
  return assets[0];
}

function isVideoAsset(asset: ViewerJobAsset | null | undefined) {
  return asset?.type === "video";
}

export function ViewerBoard({ job, shareUrl }: ViewerBoardProps) {
  const headerT = useTranslations("Viewer.header");
  const t = useTranslations("Viewer.details");
  const { user } = useAuth();

  const createdAtLabel = useMemo(() => dayjs(job.createdAt).format(DATE_FORMAT), [job.createdAt]);
  const initials = job.owner?.displayName?.slice(0, 1)?.toUpperCase() ?? "AI";

  const primaryAsset = getPrimaryAsset(job.assets, job.fallbackUrl);
  const referenceAssets = job.referenceAssets;
  const previewAsset = referenceAssets.length > 0 ? referenceAssets[0] : getPreviewAsset(job.assets);

  const renderPrimaryAsset = useMemo(() => {
    if (!primaryAsset) return null;

    if (isVideoAsset(primaryAsset)) {
      return (
        <video
          src={primaryAsset.url}
          controls
          playsInline
          poster={primaryAsset.posterUrl ?? primaryAsset.thumbUrl ?? undefined}
          className="h-full w-full object-contain p-2"
        />
      );
    }

    return (
      <Image
        src={primaryAsset.url}
        alt={primaryAsset.alt ?? "Generated image"}
        fill
        sizes="(max-width: 1024px) 100vw, 65vw"
        priority
        className="object-contain p-6"
      />
    );
  }, [primaryAsset]);

  const renderReferenceThumb = useCallback((asset: ViewerJobAsset) => {
    if (isVideoAsset(asset)) {
      return (
        <video
          key={asset.url}
          src={asset.url}
          controls
          playsInline
          poster={asset.posterUrl ?? asset.thumbUrl ?? undefined}
          className="h-full w-full object-cover"
        />
      );
    }

    return (
      <Image
        key={asset.url}
        src={asset.url}
        alt={asset.alt ?? "Reference"}
        width={64}
        height={80}
        className="h-full w-full object-cover"
      />
    );
  }, []);

  const aspectRatioStyle = useMemo(() => {
    if (!primaryAsset?.width || !primaryAsset?.height) {
      return undefined;
    }

    const width = Number(primaryAsset.width);
    const height = Number(primaryAsset.height);

    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return undefined;
    }

    return { aspectRatio: `${width} / ${height}` };
  }, [primaryAsset?.width, primaryAsset?.height]);

  const handleCopyPrompt = useCallback(() => {
    if (!job.prompt) {
      toast.warning(t("copyPromptFallback", { default: "No prompt available" }));
      return;
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(job.prompt)
        .then(() => toast.success(t("copyPromptSuccess", { default: "Prompt copied" })))
        .catch(() => toast.error(t("copyPromptError", { default: "Copy failed" })));
    } else {
      const result = window.prompt(t("copyPromptManual", { default: "Copy prompt" }), job.prompt);
      if (result !== null) {
        toast.success(t("copyPromptSuccess", { default: "Prompt copied" }));
      }
    }
  }, [job.prompt, t]);

  const quickShare = useCallback(() => {
    if (navigator.share) {
      navigator
        .share({ url: shareUrl })
        .then(() => toast.success(headerT("copySuccess", { default: "Link copied" })))
        .catch(() => {});
      return;
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => toast.success(headerT("copySuccess", { default: "Link copied" })))
        .catch(() => toast.error(t("copyPromptError", { default: "Copy failed" })));
      return;
    }

    window.prompt(t("copyPromptManual", { default: "Copy link" }), shareUrl);
  }, [shareUrl, headerT, t]);

  const tagCandidates = [job.modalityLabel, job.modelLabel]
    .filter((tag): tag is string => Boolean(tag))
    .slice(0, 5);

  return (
    <Card className="mx-auto w-full max-w-[56rem] overflow-hidden border border-white/10 bg-[#0d1026]/95 text-white">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.25fr)_minmax(360px,1fr)]">
        <div className="border-b border-white/10 md:border-b-0 md:border-r">
          <div
            className={cn(
              "relative w-full bg-[#11132a]",
              aspectRatioStyle ? undefined : "aspect-[3/4]"
            )}
            style={aspectRatioStyle}
          >
            {renderPrimaryAsset}
          </div>
        </div>

        <div className="space-y-5 p-6">
          <header className="flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-white/20">
                <AvatarImage src={job.owner?.avatarUrl ?? undefined} alt={job.owner?.displayName ?? "Creator"} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-sm">
                <span className="font-medium text-white">{job.owner?.displayName ?? t("unknownUser")}</span>
                <span className="text-white/60">{createdAtLabel}</span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/10 text-white">
              {job.modalityLabel ?? "AI"}
            </Badge>
          </header>

          <section className="space-y-3 text-xs text-white/70">
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{t("modelLabel", { default: "Model" })}</span>
              <span className="text-white/80">{job.modelLabel ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{t("modalityLabel", { default: "Type" })}</span>
              <span className="text-white/80">{job.modalityLabel ?? job.modality ?? "—"}</span>
            </div>

            {referenceAssets.length > 0 ? (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wide text-white/50 mb-2">
                  {t("preview", { default: "Reference" })}
                </h4>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {referenceAssets.map((asset) => (
                    <div
                      key={asset.url}
                      className="h-20 w-16 shrink-0 overflow-hidden rounded border border-white/10"
                    >
                      {renderReferenceThumb(asset)}
                    </div>
                  ))}
                </div>
              </div>
            ) : previewAsset ? (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wide text-white/50 mb-2">
                  {t("preview", { default: "Reference" })}
                </h4>
                <div className="w-16 h-20 overflow-hidden rounded border border-white/10">
                  {renderReferenceThumb(previewAsset)}
                </div>
              </div>
            ) : null}

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  {t("promptLabel", { default: "Prompt" })}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] text-white/70 transition hover:text-white"
                  onClick={handleCopyPrompt}
                >
                  <Copy className="h-3 w-3" />
                  {t("copyPrompt", { default: "Copy" })}
                </button>
              </div>
              <Textarea
                value={job.prompt ?? "—"}
                readOnly
                className="min-h-[48px] bg-[#05070f] border-white/10 text-white/80 text-xs resize-none"
              />
            </div>

            {tagCandidates.length > 0 ? (
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-white/60 mb-1">
                  {t("tags", { default: "Tags" })}
                </h4>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {tagCandidates.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-white/10 text-white/70">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-3 border-t border-white/10 pt-5 text-sm text-white">
            <h4 className="text-sm font-semibold text-white">{t("generateCTA", { default: "Create Similar Image" })}</h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button variant="outline" className="h-10 justify-start border-white/10 bg-transparent text-white">
                <ImageIcon className="mr-2 h-4 w-4" />
                {t("actions.textToImage", { default: "Text to Image" })}
              </Button>
              <Button variant="outline" className="h-10 justify-start border-white/10 bg-transparent text-white">
                <ImageIcon className="mr-2 h-4 w-4" />
                {t("actions.imageToImage", { default: "Image to Image" })}
              </Button>
              <Button variant="outline" className="h-10 justify-start border-white/10 bg-transparent text-white">
                <Video className="mr-2 h-4 w-4" />
                {t("actions.textToVideo", { default: "Text to Video" })}
              </Button>
              <Button variant="outline" className="h-10 justify-start border-white/10 bg-transparent text-white">
                <Video className="mr-2 h-4 w-4" />
                {t("actions.imageToVideo", { default: "Image to Video" })}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="p-2 text-white/70 hover:text-white">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="p-2 text-white/70 hover:text-white">
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-2 text-white/70 hover:text-white"
                  onClick={quickShare}
                >
                  <ShareIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="p-2 text-white/70 hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <Button className="bg-pink-600 text-white hover:bg-pink-700 sm:min-w-[160px]">
                {t("generateCTA", { default: "Create Similar Image" })}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </Card>
  );
}
