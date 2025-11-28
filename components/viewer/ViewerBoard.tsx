"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link as I18nLink, useRouter } from "@/i18n/routing";
import { downloadBase64File, downloadViaProxy } from "@/lib/downloadFile";
import dayjs from "dayjs";
import {
  Copy,
  Crown, Download,
  Heart,
  ImageIcon,
  Link as LinkIcon,
  Share as ShareIcon,
  Video,
  Waves
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import type { ViewerJob, ViewerJobAsset } from "@/actions/ai-jobs/public";
import { TEXT_TO_IMAGE_DEFAULT_MODEL } from "@/components/ai/text-image-models";
import { DEFAULT_VIDEO_MODEL } from "@/components/ai/video-models";
import AudioPlayer from "@/components/audio-player";
import { ShareDialog } from "@/components/ShareDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { RepromptDraft } from "@/lib/ai/creation-retry";
import { cn } from "@/lib/utils";
import { useRepromptStore } from "@/stores/repromptStore";


const DATE_FORMAT = "YYYY-MM-DD HH:mm";

function inferFileExtension(url?: string | null, fallback: string = "png") {
  if (!url) {
    return fallback;
  }
  const clean = url.split(/[?#]/)[0] ?? "";
  const match = clean.match(/\.([a-zA-Z0-9]+)$/);
  if (!match) {
    return fallback;
  }
  const ext = match[1].toLowerCase();
  if (!ext || ext.length > 6) {
    return fallback;
  }
  return ext;
}

function sanitizeFileStem(raw?: string | null) {
  if (!raw) {
    return null;
  }
  const stem = raw
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase()
    .slice(0, 48)
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return stem.length > 0 ? stem : null;
}

function buildDownloadFileName(job: ViewerJob, variant: "watermark" | "clean", extension: string) {
  const stem =
    sanitizeFileStem(job.prompt) ??
    sanitizeFileStem(job.modelLabel) ??
    `nexty-${job.id.slice(0, 6)}`;
  const suffix = variant === "watermark" ? "-wm" : "-clean";
  return `${stem}${suffix}.${extension}`;
}

const ACTION_ROUTE_MAP = {
  "text-to-image": "/text-to-image",
  "image-to-image": "/image-to-image",
  "text-to-video": "/text-to-video",
  "image-to-video": "/image-to-video",
} as const;

const MODALITY_ACTION_MAP: Record<string, ViewerAction> = {
  t2i: "text-to-image",
  i2i: "image-to-image",
  t2v: "text-to-video",
  i2v: "image-to-video",
};

type ViewerAction = keyof typeof ACTION_ROUTE_MAP;

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
  const router = useRouter();
  const setRepromptDraft = useRepromptStore((state) => state.setDraft);
  const [isLiked, setIsLiked] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const createdAtLabel = useMemo(() => dayjs(job.createdAt).format(DATE_FORMAT), [job.createdAt]);
  const initials = job.owner?.displayName?.slice(0, 1)?.toUpperCase() ?? "AI";

  const primaryAsset = getPrimaryAsset(job.assets, job.fallbackUrl);
  const referenceAssets = job.referenceAssets;
  const actionUrlMap = useMemo(() => {
    return {
      "text-to-image": ACTION_ROUTE_MAP["text-to-image"],
      "image-to-image": ACTION_ROUTE_MAP["image-to-image"],
      "text-to-video": ACTION_ROUTE_MAP["text-to-video"],
      "image-to-video": ACTION_ROUTE_MAP["image-to-video"],
    } satisfies Record<ViewerAction, string>;
  }, []);
  const defaultAction: ViewerAction = MODALITY_ACTION_MAP[job.modality ?? ""] ?? "text-to-image";
  const referenceImageUrls = useMemo(() => {
    const refs = job.referenceAssets
      .filter((asset) => asset.type === "image" && typeof asset.url === "string" && asset.url.length > 0)
      .map((asset) => asset.url);
    if (refs.length === 0) {
      const fallback = job.assets.find((asset) => asset.type === "image" && asset.url);
      if (fallback?.url) {
        refs.push(fallback.url);
      }
    }
    return refs;
  }, [job.referenceAssets, job.assets]);
  const primaryImageForVideo = referenceImageUrls[0] ?? primaryAsset?.url ?? null;

  const buildDraftForAction = useCallback(
    (action: ViewerAction): RepromptDraft => {
      const prompt = job.prompt ?? "";
      const translatePrompt = false;
      const isImageJob = job.modality === "t2i" || job.modality === "i2i";
      const isVideoJob = job.modality === "t2v" || job.modality === "i2v";
      const imageModel = isImageJob ? job.modelLabel ?? undefined : undefined;
      const videoModel = isVideoJob ? job.modelLabel ?? undefined : undefined;

      if (action === "text-to-image") {
        return {
          kind: "text-to-image",
          route: "/text-to-image",
          prompt,
          translatePrompt,
          model: imageModel ?? TEXT_TO_IMAGE_DEFAULT_MODEL,
        };
      }

      if (action === "image-to-image") {
        return {
          kind: "image-to-image",
          route: "/image-to-image",
          prompt,
          translatePrompt,
          model: imageModel ?? TEXT_TO_IMAGE_DEFAULT_MODEL,
          referenceImageUrls,
        };
      }

      if (action === "text-to-video") {
        return {
          kind: "text-to-video",
          route: "/text-to-video",
          prompt,
          translatePrompt,
          model: videoModel ?? DEFAULT_VIDEO_MODEL,
        };
      }

      return {
        kind: "image-to-video",
        route: "/image-to-video",
        prompt,
        translatePrompt,
        model: videoModel ?? DEFAULT_VIDEO_MODEL,
        mode: "image",
        primaryImageUrl: primaryImageForVideo ?? undefined,
      };
    },
    [job.prompt, job.modality, job.modelLabel, referenceImageUrls, primaryImageForVideo]
  );

  const handleActionNavigate = useCallback(
    (action: ViewerAction, overrideUrl?: string) => {
      const targetUrl = overrideUrl ?? actionUrlMap[action];
      if (!targetUrl) {
        return;
      }
      const draft = buildDraftForAction(action);
      setRepromptDraft(draft);
      router.push(targetUrl);
    },
    [actionUrlMap, buildDraftForAction, router, setRepromptDraft]
  );

  const renderPrimaryAsset = useMemo(() => {
    if (!primaryAsset) {
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

  const handleShare = useCallback(() => {
    setShareDialogOpen(true);
  }, []);

  const handleCopyLink = useCallback(() => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => toast.success(headerT("copySuccess", { default: "Link copied" })))
        .catch(() => toast.error(t("copyPromptError", { default: "Copy failed" })));
    } else {
      const result = window.prompt(t("copyPromptManual", { default: "Copy link" }), shareUrl);
      if (result !== null) {
        toast.success(headerT("copySuccess", { default: "Link copied" }));
      }
    }
  }, [shareUrl, headerT, t]);

  const handleDownloadOptionClick = useCallback(
    async (variant: "watermark" | "clean") => {
      let urlToDownload = primaryAsset?.url;
      if (variant === "watermark") {
        urlToDownload = primaryAsset?.url;
      } else {
        urlToDownload = primaryAsset?.url;
      }

      if (!urlToDownload) {
        toast.error(t("downloadFailed", { default: "Download failed" }));
        return;
      }

      const fallbackExt = isVideoAsset(primaryAsset) ? "mp4" : isAudioAsset(primaryAsset) ? "mp3" : "png";
      const extension = inferFileExtension(urlToDownload, fallbackExt);
      const fileName = buildDownloadFileName(job, variant, extension);

      if (urlToDownload.startsWith("data:")) {
        downloadBase64File(urlToDownload, fileName);
        return;
      }

      const proxied = await downloadViaProxy(urlToDownload, fileName, { taskId: job.id, variant });
      if (!proxied) {
        toast.error(t("downloadFailed", { default: "Download failed" }));
      }
    },
    [job, primaryAsset, t]
  );

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
              <Button
                variant="outline"
                className="h-10 justify-start border-white/10 bg-transparent text-white"
                onClick={() => handleActionNavigate("text-to-image")}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                {t("actions.textToImage", { default: "Text to Image" })}
              </Button>
              <Button
                variant="outline"
                className="h-10 justify-start border-white/10 bg-transparent text-white"
                onClick={() => handleActionNavigate("image-to-image")}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                {t("actions.imageToImage", { default: "Image to Image" })}
              </Button>
              <Button
                variant="outline"
                className="h-10 justify-start border-white/10 bg-transparent text-white"
                onClick={() => handleActionNavigate("text-to-video")}
              >
                <Video className="mr-2 h-4 w-4" />
                {t("actions.textToVideo", { default: "Text to Video" })}
              </Button>
              <Button
                variant="outline"
                className="h-10 justify-start border-white/10 bg-transparent text-white"
                onClick={() => handleActionNavigate("image-to-video")}
              >
                <Video className="mr-2 h-4 w-4" />
                {t("actions.imageToVideo", { default: "Image to Video" })}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("p-2 transition-colors", isLiked ? "text-red-500 hover:text-red-600" : "text-white/70 hover:text-white")}
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-2 text-white/70 hover:text-white"
                  onClick={handleCopyLink}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-2 text-white/70 hover:text-white"
                  onClick={handleShare}
                >
                  <ShareIcon className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="p-2 text-white/70 hover:text-white">
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="center"
                    sideOffset={12}
                    className="w-48 rounded-2xl border border-white/10 bg-[#1c1c1a] px-2 py-1 text-white/80 shadow-[0_12px_30px_rgba(0,0,0,0.4)]"
                  >
                    <DropdownMenuItem
                      onSelect={(event: Event) => {
                        event.preventDefault();
                        void handleDownloadOptionClick("watermark");
                      }}
                      className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs focus:bg-white/10 focus:text-[#dc2e5a] hover:text-[#dc2e5a] cursor-pointer text-white/80"
                    >
                      <Download className="h-4 w-4 text-inherit" />
                      <span className="flex-1">{t("downloadWatermark", { default: "Download with watermark" })}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        void handleDownloadOptionClick("clean");
                      }}
                      className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs focus:bg-white/10 focus:text-[#dc2e5a] hover:text-[#dc2e5a] cursor-pointer text-white/80"
                    >
                      <Download className="h-4 w-4 text-inherit" />
                      <span className="flex-1">{t("downloadClean", { default: "Download clean" })}</span>
                      <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#dc2e5a]/20">
                        <Crown className="h-3 w-3 text-[#ffba49]" />
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button
                className="bg-[#dc2e5a] text-white hover:bg-[#dc2e5a]/90 sm:min-w-[160px]"
                onClick={() => handleActionNavigate(defaultAction)}
              >
                {t("generateCTA", { default: "Create Similar Image" })}
              </Button>
            </div>
          </section>
        </div>
      </div>
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareUrl={shareUrl}
        title="Create Realistic/Imaginary HD Videos or Image | BestMaker Ai"
      />
    </Card >
  );
}
