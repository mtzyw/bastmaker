import { mapFreepikStatus } from "@/lib/ai/freepik-status";
import { formatProviderError } from "@/lib/ai/provider-error";
import { refundCreditsForJob } from "@/lib/ai/job-finance";
import type { Database, Json } from "@/lib/supabase/types";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const taskPayloadSchema = z
  .object({
    task_id: z.string().min(1).optional(),
    freepik_task_id: z.string().min(1).optional(),
    status: z.string().min(1),
    generated: z.array(z.string().min(1)).nullish(),
    urls: z.array(z.string().min(1)).nullish(),
    public_url: z.string().min(1).nullish(),
    error: z.unknown().optional(),
  })
  .passthrough();

const webhookSchema = z.union([
  z
    .object({ data: taskPayloadSchema })
    .passthrough(),
  taskPayloadSchema,
]);

const AUDIO_EXTENSIONS = [".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a"];
const AUDIO_KEY_HINTS = ["audio", "sound", "result", "data", "output", "generated", "media", "file", "url", "items", "assets"];

function withDefault<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback;
}

function hasAudioExtension(url: string) {
  const normalized = url.split(/[?#]/)[0].toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

function shouldTraverseAudioKey(key: string) {
  const lower = key.toLowerCase();
  return AUDIO_KEY_HINTS.some((hint) => lower.includes(hint));
}

function addAudioCandidate(url: string, bucket: Set<string>, contextHint?: string) {
  if (typeof url !== "string") {
    return;
  }
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return;
  }
  const hasExt = hasAudioExtension(trimmed);
  const lowerHint = (contextHint ?? "").toLowerCase();
  if (!hasExt && !(lowerHint.includes("audio") || lowerHint.includes("sound"))) {
    return;
  }
  bucket.add(trimmed);
}

function collectAudioUrls(value: unknown, bucket: Set<string>, contextHint?: string, depth = 0) {
  if (depth > 5 || value === null || value === undefined) {
    return;
  }

  if (typeof value === "string") {
    addAudioCandidate(value, bucket, contextHint);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectAudioUrls(entry, bucket, contextHint, depth + 1));
    return;
  }

  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, nested]) => {
      if (typeof nested === "string") {
        addAudioCandidate(nested, bucket, key);
        return;
      }

      if (Array.isArray(nested) || (nested && typeof nested === "object")) {
        if (shouldTraverseAudioKey(key)) {
          collectAudioUrls(nested, bucket, key, depth + 1);
        }
      }
    });
  }
}

function extractAudioOutputs(task: unknown): string[] {
  const bucket = new Set<string>();
  collectAudioUrls(task, bucket);
  return Array.from(bucket);
}

function normalizePromptOutputs(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (error) {
    console.error("[freepik-webhook] failed to read body", error);
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }

  if (!rawBody || rawBody.trim().length === 0) {
    console.warn("[freepik-webhook] empty payload received");
    return NextResponse.json({ success: true });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch (error) {
    console.error("[freepik-webhook] invalid JSON", error);
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(json);
  if (!parsed.success) {
    console.error("[freepik-webhook] schema validation failed", parsed.error.format());
    console.error("[freepik-webhook] raw payload", json);
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase service role credentials are not configured");
    return NextResponse.json({ success: false, error: "Server misconfigured" }, { status: 500 });
  }

  const parsedPayload = parsed.data as
    | z.infer<typeof taskPayloadSchema>
    | { data: z.infer<typeof taskPayloadSchema> };

  const task = ("data" in parsedPayload ? parsedPayload.data : parsedPayload) as z.infer<
    typeof taskPayloadSchema
  >;
  const providerTaskId = task.task_id ?? task.freepik_task_id ?? null;

  if (!providerTaskId) {
    console.error("[freepik-webhook] missing task identifier", task);
    return NextResponse.json({ success: false, error: "Missing task identifier" }, { status: 400 });
  }

  const freepikStatus = task.status;
  const internalStatus = mapFreepikStatus(freepikStatus);

  const adminSupabase = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: job, error: jobError } = await adminSupabase
    .from("ai_jobs")
    .select("id, user_id, cost_actual_credits, metadata_json, status")
    .eq("provider_job_id", providerTaskId)
    .limit(1)
    .maybeSingle();

  if (jobError) {
    console.error("[freepik-webhook] failed to load ai_job", jobError);
    return NextResponse.json({ success: false }, { status: 500 });
  }

  if (!job) {
    const { data: promptRecord, error: promptError } = await adminSupabase
      .from("ai_prompt_improvements")
      .select("id, status, generated_prompts")
      .eq("freepik_task_id", providerTaskId)
      .maybeSingle();

    if (promptError) {
      console.error("[freepik-webhook] failed to load prompt improvement", promptError);
      return NextResponse.json({ success: false }, { status: 500 });
    }

    if (!promptRecord) {
      console.warn(`(freepik-webhook) job not found for provider_job_id=${providerTaskId}`);
      return NextResponse.json({ success: true });
    }

    console.log("[freepik-webhook] prompt improvement payload", {
      providerTaskId,
      freepikStatus,
      task,
    });

    const normalizedStatus = mapFreepikStatus(freepikStatus);
    const generatedPrompts = normalizePromptOutputs(task.generated);
    const errorMessage =
      normalizedStatus === "failed"
        ? formatProviderError(task.error) ?? "提示词优化失败，请稍后重试。"
        : null;

    const updatePayload: Database["public"]["Tables"]["ai_prompt_improvements"]["Update"] = {
      status: normalizedStatus,
      freepik_status: freepikStatus,
      generated_prompts: generatedPrompts.length > 0 ? generatedPrompts : promptRecord.generated_prompts,
      error_message: errorMessage,
    };

    const { error: updateError } = await adminSupabase
      .from("ai_prompt_improvements")
      .update(updatePayload)
      .eq("id", promptRecord.id);

    if (updateError) {
      console.error("[freepik-webhook] failed to update prompt improvement", updateError);
      return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  const metadata = (job.metadata_json ?? {}) as Record<string, any>;
  const outputType =
    metadata.source === "video" || metadata.source === "lip-sync" || metadata.modality_code === "t2v"
      ? "video"
      : metadata.source === "sound" || metadata.modality_code === "t2a"
        ? "audio"
        : "image";
  const updatedMetadata: Record<string, any> = {
    ...metadata,
    freepik_latest_status: freepikStatus,
    freepik_last_event_at: new Date().toISOString(),
  };

  const updates: Record<string, any> = {
    status: internalStatus,
    metadata_json: updatedMetadata,
  };

  if (internalStatus === "processing" && !metadata.started_at) {
    const startedAt = new Date().toISOString();
    updates.started_at = startedAt;
    updatedMetadata.started_at = startedAt;
  }

  if (internalStatus === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  if (internalStatus === "failed") {
    const providerError = formatProviderError(task.error);
    const errorMessage =
      providerError ?? withDefault(metadata.error_message, "Generation failed. Please try again.");
    updates.error_message = errorMessage;
    updatedMetadata.error_message = errorMessage;
  }

  const rawOutputs = task.urls?.length
    ? task.urls
    : task.public_url
      ? [task.public_url]
      : task.generated?.length
        ? task.generated
        : [];

  let generatedOutputs = rawOutputs
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .map((entry) => entry.trim());

  if (generatedOutputs.length === 0 && outputType === "audio") {
    generatedOutputs = extractAudioOutputs(task);
  }

  if (internalStatus === "completed" && generatedOutputs.length > 0) {
    const { data: existingOutputs } = await adminSupabase
      .from("ai_job_outputs")
      .select("url, type, thumb_url, width, height, duration")
      .eq("job_id", job.id);

    const existingUrls = new Set(existingOutputs?.map((item) => item.url).filter(Boolean));

    const rowsToInsert = generatedOutputs
      .filter((url) => !existingUrls.has(url))
      .map((url, index) => ({
        job_id: job.id,
        index,
        type: outputType,
        url,
      }));

    if (rowsToInsert.length > 0) {
      await adminSupabase.from("ai_job_outputs").insert(rowsToInsert);
    }

    const existingAssets = (existingOutputs ?? [])
      .filter((output) => Boolean(output.url))
      .map((output) => {
        const type = (output.type ?? "").toLowerCase();
        const normalizedType = type.startsWith("video")
          ? "video"
          : type.startsWith("image")
            ? "image"
            : "unknown";

        return {
          type: normalizedType,
          url: output.url,
          thumbUrl: output.thumb_url,
          posterUrl: output.thumb_url,
          width: output.width,
          height: output.height,
          duration: output.duration,
        };
      });

    const insertedAssets = rowsToInsert
      .filter((row) => Boolean(row.url))
      .map((row) => ({
        type: outputType,
        url: row.url,
        thumbUrl: null,
        posterUrl: null,
        width: null,
        height: null,
        duration: null,
      }));

    const assetMap = new Map<string, any>();
    [...existingAssets, ...insertedAssets].forEach((asset) => {
      if (!asset.url) return;
      if (!assetMap.has(asset.url)) {
        assetMap.set(asset.url, asset);
      }
    });

    updatedMetadata.output_count = assetMap.size;

    updates.public_assets = Array.from(assetMap.values());
  }

  if (internalStatus === "failed" && job.cost_actual_credits && job.cost_actual_credits > 0 && !metadata.refund_issued) {
    if (job.user_id) {
      await refundCreditsForJob(
        adminSupabase,
        job.user_id,
        job.cost_actual_credits,
        job.id,
        "Refund: Freepik task failure"
      );
    }
    updates.cost_actual_credits = 0;
    updatedMetadata.refund_issued = true;
  }

  await adminSupabase
    .from("ai_jobs")
    .update(updates)
    .eq("id", job.id);

  await adminSupabase.from("ai_job_events").insert({
    job_id: job.id,
    event_type: `freepik_task_${internalStatus}`,
    payload_json: json as Json,
  });

  return NextResponse.json({ success: true });
}
