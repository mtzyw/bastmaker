import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

export async function attachJobToLatestCreditLog(
  adminSupabase: SupabaseClient<Database>,
  userId: string,
  jobId: string,
  note: string
) {
  const { data: latestLog } = await adminSupabase
    .from("credit_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "feature_usage")
    .is("related_job_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestLog) {
    return;
  }

  await adminSupabase
    .from("credit_logs")
    .update({ related_job_id: jobId, notes: note })
    .eq("id", latestLog.id);
}

export async function refundCreditsForJob(
  adminSupabase: SupabaseClient<Database>,
  userId: string,
  amount: number,
  jobId: string,
  note = "Refund: Freepik job failure"
) {
  if (amount <= 0) {
    return;
  }

  try {
    await adminSupabase.rpc("grant_one_time_credits_and_log", {
      p_user_id: userId,
      p_credits_to_add: amount,
    });

    const { data: latestLog } = await adminSupabase
      .from("credit_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "one_time_purchase")
      .is("related_job_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestLog) {
      return;
    }

    await adminSupabase
      .from("credit_logs")
      .update({
        related_job_id: jobId,
        notes: note,
        type: "refund_revoke",
      })
      .eq("id", latestLog.id);
  } catch (error) {
    console.error("[freepik] refund credits failed", error);
  }
}
