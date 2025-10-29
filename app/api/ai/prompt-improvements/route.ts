import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { apiResponse } from "@/lib/api-response";
import { mapFreepikStatus } from "@/lib/ai/freepik-status";
import {
  FreepikRequestError,
  improveFreepikPrompt,
} from "@/lib/ai/freepik-client";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const requestSchema = z.object({
  prompt: z.string().min(1).max(2500),
  language: z
    .string()
    .regex(/^[a-z]{2}$/)
    .optional(),
  targetType: z.enum(["image", "video"]).default("video"),
});

function getWebhookUrl(): string {
  const base = process.env.WEBHOOK_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("WEBHOOK_BASE_URL is not configured");
  }
  return `${base}/api/ai/freepik/webhook`;
}

function normalizeGenerated(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiResponse.badRequest("Invalid JSON payload");
  }

  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return apiResponse.badRequest("Invalid request payload");
  }

  const { prompt, language, targetType } = parsed.data;
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    return apiResponse.badRequest("Prompt is required");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiResponse.unauthorized();
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase service role credentials are not configured");
    return apiResponse.serverError("Server configuration error");
  }

  const adminSupabase = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: inserted, error: insertError } = await adminSupabase
    .from("ai_prompt_improvements")
    .insert({
      user_id: user.id,
      original_prompt: trimmedPrompt,
      language: language ?? null,
      target_type: targetType,
      status: "pending",
    })
    .select()
    .single();

  if (insertError || !inserted) {
    console.error("[prompt-improvements] failed to insert record", insertError);
    return apiResponse.serverError("Failed to create prompt improvement task");
  }

  const webhookUrl = getWebhookUrl();

  try {
    const response = await improveFreepikPrompt({
      prompt: trimmedPrompt,
      type: targetType,
      language,
      webhook_url: webhookUrl,
    });

    const payload = (response as Record<string, any> | null)?.data ?? null;
    const freepikTaskId =
      typeof payload?.task_id === "string" && payload.task_id.length > 0
        ? payload.task_id
        : null;
    const freepikStatus =
      typeof payload?.status === "string" && payload.status.length > 0
        ? payload.status
        : null;
    const generated = normalizeGenerated(payload?.generated);
    if (!freepikTaskId && generated.length === 0) {
      throw new Error("未获取到任务 ID，无法查询优化结果");
    }
    const normalizedStatus = freepikStatus ? mapFreepikStatus(freepikStatus) : "queued";

    const updatePayload: Database["public"]["Tables"]["ai_prompt_improvements"]["Update"] = {
      status: generated.length > 0 ? "completed" : normalizedStatus,
      freepik_status: freepikStatus,
      freepik_task_id: freepikTaskId,
      generated_prompts: generated.length > 0 ? generated : null,
    };

    const { data: updated } = await adminSupabase
      .from("ai_prompt_improvements")
      .update(updatePayload)
      .eq("id", inserted.id)
      .select()
      .single();

    const improvement = updated ?? {
      ...inserted,
      ...updatePayload,
    };

    return apiResponse.success({
      improvement: {
        id: improvement.id,
        status: improvement.status,
        freepikStatus: improvement.freepik_status,
        generatedPrompts: normalizeGenerated(improvement.generated_prompts),
        errorMessage: improvement.error_message,
        createdAt: improvement.created_at,
        updatedAt: improvement.updated_at,
      },
    });
  } catch (error) {
    const message =
      error instanceof FreepikRequestError
        ? error.message
        : error instanceof Error
          ? error.message
          : "提示词优化失败，请稍后重试";

    try {
      await adminSupabase
        .from("ai_prompt_improvements")
        .update({
          status: "failed",
          freepik_status: null,
          error_message: message,
        })
        .eq("id", inserted.id);
    } catch (updateError) {
      console.error("[prompt-improvements] failed to record failure state", updateError);
    }

    console.error("[prompt-improvements] improve prompt error", error);
    const status =
      error instanceof FreepikRequestError && error.status ? error.status : 502;
    return apiResponse.error(message, status);
  }
}
