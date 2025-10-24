"use server";

import { actionResponse } from "@/lib/action-response";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { shareModalityDisplayName, shareModelDisplayName } from "@/lib/share/job-metadata";

export type ViewerJobAsset = {
  type: "image" | "video" | "audio" | "unknown";
  url: string;
  thumbUrl?: string | null;
  posterUrl?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  alt?: string | null;
};

export type ViewerJob = {
  id: string;
  shareSlug: string;
  modality: string | null;
  modalityLabel: string | null;
  modelLabel: string | null;
  title: string | null;
  summary: string | null;
  prompt: string | null;
  assets: ViewerJobAsset[];
  referenceAssets: ViewerJobAsset[];
  fallbackUrl: string | null;
  createdAt: string;
  owner: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    invite_code: string | null;
  } | null;
  shareStats: {
    visits: number;
    conversions: number;
  };
};

function detectAssetType(typeInput?: string | null, mimeType?: string | null, url?: string | null): ViewerJobAsset["type"] {
  const lowerType = (typeInput ?? "").toLowerCase();
  const lowerMime = (mimeType ?? "").toLowerCase();
  const lowerUrl = (url ?? "").toLowerCase();

  const videoHints = ["video", "mp4", "webm", "mov", "avi", "mkv", "m4v"];
  const imageHints = ["image", "png", "jpg", "jpeg", "webp", "gif", "avif", "heic", "bmp"];
  const audioHints = ["audio", "mp3", "wav", "aac", "flac", "ogg", "m4a"];

  const includesHint = (value: string, hints: string[]) => hints.some((hint) => value.includes(hint));

  if (includesHint(lowerType, videoHints) || includesHint(lowerMime, videoHints) || videoHints.some((ext) => lowerUrl.endsWith(`.${ext}`))) {
    return "video";
  }

  if (includesHint(lowerType, imageHints) || includesHint(lowerMime, imageHints) || imageHints.some((ext) => lowerUrl.endsWith(`.${ext}`))) {
    return "image";
  }

  if (includesHint(lowerType, audioHints) || includesHint(lowerMime, audioHints) || audioHints.some((ext) => lowerUrl.endsWith(`.${ext}`))) {
    return "audio";
  }

  return "unknown";
}

function normaliseAssets(row: Database["public"]["Tables"]["ai_job_outputs"]["Row"]): ViewerJobAsset | null {
  if (!row.url) {
    return null;
  }

  const type = detectAssetType(row.type, row.mime_type, row.url);

  return {
    type,
    url: row.url,
    thumbUrl: row.thumb_url,
    posterUrl: row.thumb_url,
    width: row.width,
    height: row.height,
    duration: row.duration,
  };
}

function normaliseSnapshotAsset(asset: unknown): ViewerJobAsset | null {
  if (!asset || typeof asset !== "object") return null;
  const raw = asset as Record<string, unknown>;
  const url = typeof raw.url === "string" ? raw.url : null;
  if (!url) return null;

  const type = detectAssetType(
    typeof raw.type === "string" ? raw.type : null,
    typeof raw.mimeType === "string" ? raw.mimeType : typeof raw.mime_type === "string" ? (raw.mime_type as string) : null,
    url
  );

  return {
    type,
    url,
    thumbUrl: typeof raw.thumbUrl === "string" ? raw.thumbUrl : null,
    posterUrl: typeof raw.posterUrl === "string" ? raw.posterUrl : typeof raw.thumbUrl === "string" ? (raw.thumbUrl as string) : null,
    width: typeof raw.width === "number" ? raw.width : null,
    height: typeof raw.height === "number" ? raw.height : null,
    duration: typeof raw.duration === "number" ? raw.duration : null,
    alt: typeof raw.alt === "string" ? raw.alt : null,
  };
}

function buildOwnerSummary(user: Database["public"]["Tables"]["users"]["Row"] | null) {
  if (!user) return null;
  const displayName = user.full_name || user.invite_code || null;
  return {
    id: user.id,
    displayName,
    avatarUrl: user.avatar_url,
    invite_code: user.invite_code,
  };
}

type ViewerJobOptions = {
  allowPrivateForUserId?: string;
};

export async function getViewerJobBySlug(slug: string, options?: ViewerJobOptions) {
  if (!slug) {
    return actionResponse.notFound("Missing slug", "NOT_FOUND");
  }

  const supabase = getServiceRoleClient();

  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .select(
      "id, user_id, is_public, share_slug, modality_code, model_slug_at_submit, public_title, public_summary, public_assets, metadata_json, share_visit_count, share_conversion_count, created_at"
    )
    .eq("share_slug", slug)
    .maybeSingle();

  if (jobError) {
    console.error("[viewer-job] failed to fetch ai_job", jobError);
    return actionResponse.error("Failed to load job", "SERVER_ERROR");
  }

  if (!job) {
    return actionResponse.notFound("Job not found", "NOT_FOUND");
  }

  const isOwner = options?.allowPrivateForUserId && job.user_id === options.allowPrivateForUserId;
  if (!job.is_public && !isOwner) {
    return actionResponse.notFound("Job not found", "NOT_FOUND");
  }

  const { data: owner, error: ownerError } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, invite_code")
    .eq("id", job.user_id)
    .maybeSingle();

  if (ownerError) {
    console.error("[viewer-job] failed to fetch owner", ownerError);
  }

  const { data: outputs, error: outputsError } = await supabase
    .from("ai_job_outputs")
    .select("id, job_id, type, url, thumb_url, width, height, duration, created_at")
    .eq("job_id", job.id)
    .order("created_at", { ascending: true });

  if (outputsError) {
    console.error("[viewer-job] failed to fetch outputs", outputsError);
  }

  const assetsFromOutputs = (outputs ?? [])
    .map((row) => normaliseAssets(row))
    .filter((asset): asset is ViewerJobAsset => Boolean(asset));

  const assetsFromSnapshot = Array.isArray(job.public_assets)
    ? (job.public_assets as unknown[])
        .map((asset) => normaliseSnapshotAsset(asset))
        .filter((asset): asset is ViewerJobAsset => Boolean(asset))
    : [];

  const assets = assetsFromOutputs.length > 0 ? assetsFromOutputs : assetsFromSnapshot;

  const { data: inputs, error: inputsError } = await supabase
    .from("ai_job_inputs")
    .select("index, type, source, url, metadata_json")
    .eq("job_id", job.id)
    .order("index", { ascending: true });

  if (inputsError) {
    console.error("[viewer-job] failed to fetch inputs", inputsError);
  }

  const referenceSourceLabels: Record<string, string> = {
    reference: "Reference image",
    primary: "Source image",
    tail: "Tail image",
    intro: "Intro image",
    outro: "Outro image",
  };

  let referenceAssets = (inputs ?? [])
    .filter((input) => typeof input?.url === "string" && input.url.length > 0)
    .map((input) => {
      const normalizedSource = typeof input.source === "string" ? input.source.toLowerCase() : "reference";
      const alt = referenceSourceLabels[normalizedSource] ?? "Reference image";

      return {
        type: "image" as const,
        url: input.url as string,
        thumbUrl: null,
        posterUrl: null,
        width: null,
        height: null,
        duration: null,
        alt,
      } satisfies ViewerJobAsset;
    });

  const fallbackUrl = assets.length > 0 ? assets[0].url : null;
  const metadata = (job.metadata_json ?? {}) as Record<string, any>;
  const prompt = typeof metadata.prompt === "string" ? metadata.prompt : metadata.original_prompt;

  const metadataMode = typeof metadata.mode === "string" ? metadata.mode.toLowerCase() : null;
  const jobModality = job.modality_code ?? (typeof metadata.modality_code === "string" ? metadata.modality_code : null);
  if (jobModality === "t2v" && metadataMode === "text") {
    referenceAssets = [];
  }

  const modalityLabel = shareModalityDisplayName(job.modality_code);
  const modelLabel = shareModelDisplayName(job.modality_code, job.model_slug_at_submit);

  return actionResponse.success<ViewerJob>({
    id: job.id,
    shareSlug: job.share_slug ?? slug,
    modality: job.modality_code ?? null,
    modalityLabel,
    modelLabel,
    title: job.public_title,
    summary: job.public_summary,
    prompt: typeof prompt === "string" ? prompt : null,
    assets,
    referenceAssets,
    fallbackUrl,
    createdAt: job.created_at,
    owner: buildOwnerSummary(owner ?? null),
    shareStats: {
      visits: job.share_visit_count,
      conversions: job.share_conversion_count,
    },
  });
}

export type PublicProfileJob = {
  id: string;
  shareSlug: string;
  title: string | null;
  summary: string | null;
  createdAt: string;
  modality: string | null;
  modalityLabel: string | null;
  modelLabel: string | null;
  coverAsset: ViewerJobAsset;
  stats: {
    visits: number;
    conversions: number;
  };
};

export type PublicProfile = {
  user: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    slug: string;
  };
  jobs: PublicProfileJob[];
  hasMore: boolean;
  totalCount: number;
};

type ProfileQueryOptions = {
  page?: number;
  pageSize?: number;
};

function buildCoverFromMetadata(metadata: Record<string, any>): ViewerJobAsset | null {
  const fallbackUrl =
    typeof metadata?.fallbackUrl === "string"
      ? metadata.fallbackUrl
      : typeof metadata?.fallback_url === "string"
        ? metadata.fallback_url
        : null;

  if (!fallbackUrl) {
    return null;
  }

  const type = detectAssetType(metadata?.fallbackType, metadata?.fallbackMimeType, fallbackUrl);

  return {
    type,
    url: fallbackUrl,
    thumbUrl: typeof metadata?.fallbackThumbUrl === "string" ? metadata.fallbackThumbUrl : null,
    posterUrl: typeof metadata?.fallbackPosterUrl === "string" ? metadata.fallbackPosterUrl : null,
    width: typeof metadata?.fallbackWidth === "number" ? metadata.fallbackWidth : null,
    height: typeof metadata?.fallbackHeight === "number" ? metadata.fallbackHeight : null,
    duration: typeof metadata?.fallbackDuration === "number" ? metadata.fallbackDuration : null,
  };
}

export async function getPublicProfileBySlug(slug: string, options?: ProfileQueryOptions) {
  if (!slug) {
    return actionResponse.notFound("Missing profile slug", "NOT_FOUND");
  }

  const page = options?.page && options.page > 0 ? Math.floor(options.page) : 0;
  const pageSize = options?.pageSize && options.pageSize > 0 ? Math.min(Math.floor(options.pageSize), 60) : 12;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const supabase = getServiceRoleClient();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, invite_code")
    .eq("invite_code", slug)
    .maybeSingle();

  if (userError) {
    console.error("[profile] failed to fetch user", userError);
    return actionResponse.error("Failed to load profile", "SERVER_ERROR");
  }

  if (!user) {
    return actionResponse.notFound("Profile not found", "NOT_FOUND");
  }

  const { data: jobs, error: jobsError, count } = await supabase
    .from("ai_jobs")
    .select(
      "id, share_slug, modality_code, model_slug_at_submit, public_title, public_summary, metadata_json, public_assets, created_at, share_visit_count, share_conversion_count",
      { count: "exact" }
    )
    .eq("user_id", user.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (jobsError) {
    console.error("[profile] failed to fetch jobs", jobsError);
    return actionResponse.error("Failed to load profile", "SERVER_ERROR");
  }

  const jobRows = jobs ?? [];
  const jobIds = jobRows.map((row) => row.id);

  let outputsByJob = new Map<string, Database["public"]["Tables"]["ai_job_outputs"]["Row"][]>();

  if (jobIds.length > 0) {
    const { data: outputs, error: outputsError } = await supabase
      .from("ai_job_outputs")
      .select("job_id, type, url, thumb_url, width, height, duration, created_at")
      .in("job_id", jobIds)
      .order("created_at", { ascending: true });

    if (outputsError) {
      console.error("[profile] failed to fetch outputs", outputsError);
    } else if (outputs) {
      outputsByJob = outputs.reduce((acc, output) => {
        const list = acc.get(output.job_id) ?? [];
        list.push(output);
        acc.set(output.job_id, list);
        return acc;
      }, new Map<string, Database["public"]["Tables"]["ai_job_outputs"]["Row"][]>());
    }
  }

  const profileJobs: PublicProfileJob[] = jobRows
    .map((job) => {
      const metadata = (job.metadata_json ?? {}) as Record<string, any>;
      const outputs = outputsByJob.get(job.id) ?? [];

      const assetsFromOutputs = outputs
        .map((row) => normaliseAssets(row))
        .filter((asset): asset is ViewerJobAsset => Boolean(asset));

      const assetsFromSnapshot = Array.isArray(job.public_assets)
        ? (job.public_assets as unknown[])
            .map((asset) => normaliseSnapshotAsset(asset))
            .filter((asset): asset is ViewerJobAsset => Boolean(asset))
        : [];

      const assets = assetsFromOutputs.length > 0 ? assetsFromOutputs : assetsFromSnapshot;

      let coverAsset = assets.length > 0 ? assets[0] : buildCoverFromMetadata(metadata);

      if (!job.share_slug || !coverAsset) {
        return null;
      }

      const modalityLabel = shareModalityDisplayName(job.modality_code);
      const modelLabel = shareModelDisplayName(job.modality_code, job.model_slug_at_submit);

      return {
        id: job.id,
        shareSlug: job.share_slug,
        title: job.public_title,
        summary: job.public_summary,
        createdAt: job.created_at,
        modality: job.modality_code,
        modalityLabel,
        modelLabel,
        coverAsset,
        stats: {
          visits: job.share_visit_count ?? 0,
          conversions: job.share_conversion_count ?? 0,
        },
      } satisfies PublicProfileJob;
    })
    .filter((job): job is PublicProfileJob => Boolean(job));

  const hasMore = typeof count === "number" ? from + profileJobs.length < count : false;

  return actionResponse.success<PublicProfile>({
    user: {
      id: user.id,
      displayName: user.full_name || user.invite_code || null,
      avatarUrl: user.avatar_url,
      slug: user.invite_code ?? slug,
    },
    jobs: profileJobs,
    hasMore,
    totalCount: count ?? profileJobs.length,
  });
}

export async function incrementAiJobShareVisit(jobId: string) {
  if (!jobId) {
    return actionResponse.badRequest("Missing jobId", "BAD_REQUEST");
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase.rpc("increment_ai_job_share_visit", {
    p_job_id: jobId,
  });

  if (error) {
    console.error("[viewer-job] failed to increment visit", error);
    return actionResponse.error("Failed to record visit", "SERVER_ERROR");
  }

  return actionResponse.success();
}

export async function incrementAiJobShareConversion(jobId: string) {
  if (!jobId) {
    return actionResponse.badRequest("Missing jobId", "BAD_REQUEST");
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase.rpc("increment_ai_job_share_conversion", {
    p_job_id: jobId,
  });

  if (error) {
    console.error("[viewer-job] failed to increment conversion", error);
    return actionResponse.error("Failed to record conversion", "SERVER_ERROR");
  }

  return actionResponse.success();
}
