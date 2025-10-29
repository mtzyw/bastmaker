import { NextRequest } from "next/server";

import { apiResponse } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";

type RouteParams = Promise<{
  id: string;
}>;

function normalizeGenerated(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

export async function GET(_req: NextRequest, context: { params: RouteParams }) {
  const { id } = await context.params;

  if (!id) {
    return apiResponse.badRequest("Prompt improvement id is required");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiResponse.unauthorized();
  }

  const { data, error } = await supabase
    .from("ai_prompt_improvements")
    .select("id, status, freepik_status, generated_prompts, error_message, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[prompt-improvements] failed to fetch record", error);
    return apiResponse.serverError("Failed to load prompt improvement");
  }

  if (!data) {
    return apiResponse.notFound("Prompt improvement not found");
  }

  return apiResponse.success({
    improvement: {
      id: data.id,
      status: data.status,
      freepikStatus: data.freepik_status,
      generatedPrompts: normalizeGenerated(data.generated_prompts),
      errorMessage: data.error_message,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}
