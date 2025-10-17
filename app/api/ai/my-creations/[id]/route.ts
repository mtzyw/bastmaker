import { NextRequest } from "next/server";

import { apiResponse } from "@/lib/api-response";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: jobId } = await context.params;

  if (!jobId || typeof jobId !== "string") {
    return apiResponse.badRequest("缺少任务 ID");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiResponse.unauthorized("请先登录");
  }

  const adminSupabase = getServiceRoleClient();

  const { data: job, error: jobQueryError } = await adminSupabase
    .from("ai_jobs")
    .select("id, user_id")
    .eq("id", jobId)
    .maybeSingle();

  if (jobQueryError) {
    console.error("[my-creations:delete] query failed", jobQueryError);
    return apiResponse.serverError("删除失败，请稍后重试");
  }

  if (!job) {
    return apiResponse.notFound("任务不存在或已删除");
  }

  if (job.user_id !== user.id) {
    return apiResponse.forbidden("无权删除该任务");
  }

  const cleanupOperations = [
    adminSupabase.from("ai_job_outputs").delete().eq("job_id", jobId),
    adminSupabase.from("ai_job_inputs").delete().eq("job_id", jobId),
    adminSupabase.from("ai_job_events").delete().eq("job_id", jobId),
    adminSupabase.from("job_share_conversions").delete().eq("job_id", jobId),
  ];

  for (const operation of cleanupOperations) {
    const { error } = await operation;
    if (error && error.code !== "PGRST116") {
      console.error("[my-creations:delete] cleanup failed", error);
      return apiResponse.serverError("删除失败，请稍后重试");
    }
  }

  const { error: deleteError } = await adminSupabase.from("ai_jobs").delete().eq("id", jobId);

  if (deleteError) {
    console.error("[my-creations:delete] delete job failed", deleteError);
    return apiResponse.serverError("删除失败，请稍后重试");
  }

  return apiResponse.success({ id: jobId });
}
