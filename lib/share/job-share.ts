import type { SupabaseClient } from "@supabase/supabase-js";

import { generateShareSlug } from "@/lib/share/slug";
import type { Database } from "@/lib/supabase/types";

type JobShareUpdate = {
  adminClient: SupabaseClient<Database>;
  jobId: string;
  currentShareSlug?: string | null;
  isPublic?: boolean;
  publicTitle?: string | null | undefined;
  publicSummary?: string | null | undefined;
  publicAssets?: unknown[] | null | undefined;
};

export async function ensureJobShareMetadata({
  adminClient,
  jobId,
  currentShareSlug,
  isPublic = true,
  publicTitle,
  publicSummary,
  publicAssets,
}: JobShareUpdate): Promise<string> {
  const shareSlug = currentShareSlug ?? generateShareSlug();

  const updatePayload: Database["public"]["Tables"]["ai_jobs"]["Update"] = {
    share_slug: shareSlug,
    is_public: isPublic,
  };

  if (publicTitle !== undefined) {
    updatePayload.public_title = publicTitle ?? null;
  }

  if (publicSummary !== undefined) {
    updatePayload.public_summary = publicSummary ?? null;
  }

  if (publicAssets !== undefined) {
    updatePayload.public_assets = Array.isArray(publicAssets) ? publicAssets : null;
  }

  const { error } = await adminClient
    .from("ai_jobs")
    .update(updatePayload)
    .eq("id", jobId);

  if (error) {
    console.error("[job-share] failed to update share metadata", { jobId, error });
    return currentShareSlug ?? shareSlug;
  }

  return shareSlug;
}
