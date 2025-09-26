"use server";

import { actionResponse } from "@/lib/action-response";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { shareModalityDisplayName, shareModelDisplayName } from "@/lib/share/job-metadata";

export type ViewerJobAsset = {
  type: "image" | "video" | "unknown";
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
  fallbackUrl: string | null;
  createdAt: string;
  owner: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  shareStats: {
    visits: number;
    conversions: number;
  };
};

function normaliseAssets(row: Database["public"]["Tables"]["ai_job_outputs"]["Row"]): ViewerJobAsset | null {
  const typeRaw = (row.type ?? "").toLowerCase();
  const baseType = typeRaw.startsWith("video")
    ? "video"
    : typeRaw.startsWith("image")
      ? "image"
      : "unknown";

  if (!row.url) {
    return null;
  }

  return {
    type: baseType,
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

  const typeRaw = typeof raw.type === "string" ? raw.type.toLowerCase() : "";
  const type: ViewerJobAsset["type"] = typeRaw.startsWith("video")
    ? "video"
    : typeRaw.startsWith("image")
      ? "image"
      : "unknown";

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
  };
}

export async function getViewerJobBySlug(slug: string) {
  if (!slug) {
    return actionResponse.notFound("Missing slug", "NOT_FOUND");
  }

  const supabase = getServiceRoleClient();

  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .select(
      "id, user_id, share_slug, modality_code, model_slug_at_submit, public_title, public_summary, public_assets, metadata_json, share_visit_count, share_conversion_count, created_at"
    )
    .eq("share_slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (jobError) {
    console.error("[viewer-job] failed to fetch ai_job", jobError);
    return actionResponse.error("Failed to load job", "SERVER_ERROR");
  }

  if (!job) {
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

  const fallbackUrl = assets.length > 0 ? assets[0].url : null;
  const metadata = (job.metadata_json ?? {}) as Record<string, any>;
  const prompt = typeof metadata.prompt === "string" ? metadata.prompt : metadata.original_prompt;

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
    fallbackUrl,
    createdAt: job.created_at,
    owner: buildOwnerSummary(owner ?? null),
    shareStats: {
      visits: job.share_visit_count,
      conversions: job.share_conversion_count,
    },
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
