"use client";

import dayjs from "dayjs";
import Image from "next/image";
import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link as I18nLink } from "@/i18n/routing";
import {
  Heart,
  Link as LinkIcon,
  Share as ShareIcon,
  MoreHorizontal,
  Copy,
  Video,
  ImageIcon,
  Waves,
} from "lucide-react";
import { toast } from "sonner";

import type { ViewerJob, ViewerJobAsset } from "@/actions/ai-jobs/public";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import AudioPlayer from "@/components/audio-player";

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

function isVideoAsset(asset: ViewerJobAsset | null | undefined) {
  return asset?.type === "video";
}

function isAudioAsset(asset: ViewerJobAsset | null | undefined) {
  return asset?.type === "audio";
}

export function ViewerBoard({ job, shareUrl }: ViewerBoardProps) {
  const headerT = useTranslations("Viewer.header");
  const t = useTranslations("Viewer.details");

  const createdAtLabel = useMemo(() => dayjs(job.createdAt).format(DATE_FORMAT), [job.createdAt]);
  const initials = job.owner?.displayName?.slice(0, 1)?.toUpperCase() ?? "AI";

  const primaryAsset = getPrimaryAsset(job.assets, job.fallbackUrl);
  const referenceAssets = job.referenceAssets;

  const renderPrimaryAsset = useMemo(() => {
    if (!primaryAsset) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[ViewerBoard] primary asset missing", {
          assetsCount: job.assets.length,
          fallbackUrl: job.fallbackUrl,
        });
      }
      return (
        <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-white/60">
          暂无可展示的媒体资源
        </div>
      );
    }

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

    if (isAudioAsset(primaryAsset)) {
      const source = primaryAsset.url ?? job.fallbackUrl;
      if (!source) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[ViewerBoard] audio asset missing url", {
            assetsCount: job.assets.length,
            fallbackUrl: job.fallbackUrl,
          });
        }
        return (
          <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-white/60">
            暂无可播放的音频资源
          </div>
        );
      }
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#111]/80 p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-white/80">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <Waves className="h-4 w-4 text-white" />
            </span>
            音频预览
          </div>
          <AudioPlayer
            src={source}
            durationSeconds={primaryAsset.duration ?? undefined}
            className="w-full max-w-[520px]"
          />
        </div>
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
  }, [primaryAsset, job]);

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

    if (isAudioAsset(asset)) {
      if (!asset.url) {
        return null;
      }
      return (
        <audio
          key={asset.url}
          src={asset.url}
          controls
          className="h-full w-full"
        >
          您的浏览器不支持 audio 标签。
        </audio>
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
    <Card className="mx-auto w-full min-h-[28rem] max-w-[56rem] border border-white/10 bg-[#1c1c1a] text-white md:h-[calc(100vh-6rem)] md:max-h-[900px] md:overflow-hidden">
      <div className="grid h-full min-h-0 grid-cols-1 md:h-full md:grid-cols-[minmax(0,1.25fr)_minmax(360px,1fr)]">
        <div className="border-b border-white/10 md:flex md:min-h-0 md:flex-col md:border-b-0 md:border-r">
          <div
            className={cn(
              "relative w-full bg-[#1c1c1a] md:flex-1 md:min-h-0",
              aspectRatioStyle ? undefined : "aspect-[3/4]"
            )}
            style={aspectRatioStyle}
          >
            {renderPrimaryAsset}
          </div>
        </div>

        <div className="flex h-full min-h-0 flex-col gap-5 p-6">
          <header className="flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex flex-col text-sm">
              {job.owner?.invite_code ? (
                <I18nLink
                  href={`/profile/${job.owner.invite_code}`}
                  className="font-medium text-white transition-colors hover:text-gray-300"
                >
                  {job.owner.displayName ?? t("unknownUser")}
                </I18nLink>
              ) : (
                <span className="font-medium text-white">
                  {job.owner?.displayName ?? t("unknownUser")}
                </span>
              )}
              <span className="text-white/60">{createdAtLabel}</span>
            </div>
            <Badge variant="secondary" className="bg-white/10 text-white">
              {job.modalityLabel ?? "AI"}
            </Badge>
          </header>

          <section className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 text-xs text-white/70">
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
                className="min-h-[96px] bg-[#1c1c1a] border-white/10 text-white/80 text-xs resize-none"
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
              <Button className="bg-[#dc2e5a] text-white hover:bg-[#dc2e5a]/90 sm:min-w-[160px]">
                {t("generateCTA", { default: "Create Similar Image" })}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </Card>
  );
}
