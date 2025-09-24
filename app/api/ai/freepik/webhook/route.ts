import { mapFreepikStatus } from "@/lib/ai/freepik-status";
import { formatProviderError } from "@/lib/ai/provider-error";
import { refundCreditsForJob } from "@/lib/ai/job-finance";
import { Database } from "@/lib/supabase/types";
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

function withDefault<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback;
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
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

  const task = "data" in parsedPayload ? parsedPayload.data : parsedPayload;
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
    console.warn(`(freepik-webhook) job not found for provider_job_id=${providerTaskId}`);
    return NextResponse.json({ success: true });
  }

  const metadata = (job.metadata_json ?? {}) as Record<string, any>;
  const outputType = metadata.source === "video" ? "video" : "image";
  const updatedMetadata = {
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
    const errorMessage = providerError ?? withDefault(metadata.error_message, "Provider reported failure");
    updates.error_message = errorMessage;
    updatedMetadata.error_message = errorMessage;
  }

  const generatedOutputs = (
    task.generated?.length
      ? task.generated
      : task.urls?.length
        ? task.urls
        : task.public_url
          ? [task.public_url]
          : []
  ).filter(Boolean);

  if (internalStatus === "completed" && generatedOutputs.length > 0) {
    const { data: existingOutputs } = await adminSupabase
      .from("ai_job_outputs")
      .select("url")
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

    updatedMetadata.output_count = generatedOutputs.length;
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
    payload_json: json,
  });

  return NextResponse.json({ success: true });
}
