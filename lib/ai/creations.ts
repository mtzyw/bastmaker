import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

export type CreationOutput = {
  id: string;
  url: string | null;
  thumbUrl: string | null;
  type: string | null;
  createdAt: string | null;
  durationSeconds?: number | null;
};

export type CreationItem = {
  jobId: string;
  providerCode: string | null;
  providerJobId: string | null;
  status: string | null;
  latestStatus: string | null;
  createdAt: string;
  costCredits: number;
  outputs: CreationOutput[];
  metadata: Record<string, any>;
  inputParams: Record<string, any>;
  modalityCode: string | null;
  modelSlug: string | null;
  errorMessage: string | null;
  seed: string | null;
  isImageToImage: boolean;
  referenceImageCount: number;
  shareSlug: string | null;
  shareVisitCount: number;
  shareConversionCount: number;
  publicTitle: string | null;
  publicSummary: string | null;
};

export type CreationsResult = {
  items: CreationItem[];
  totalCount: number;
};

const DEFAULT_PAGE_SIZE = 20;

export function getDefaultPageSize() {
  return DEFAULT_PAGE_SIZE;
}

export type FetchUserCreationsOptions = {
  modalityCodes?: string[];
};

export async function fetchUserCreations(
  supabase: SupabaseClient<Database>,
  userId: string,
  page: number,
  pageSize: number,
  options?: FetchUserCreationsOptions
): Promise<CreationsResult> {
  const safePage = Number.isFinite(page) && page >= 0 ? Math.floor(page) : 0;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 60) : DEFAULT_PAGE_SIZE;

  const from = safePage * safePageSize;
  const to = from + safePageSize - 1;

  const requestedModalityCodes = Array.isArray(options?.modalityCodes) ? options?.modalityCodes : [];
  const modalityCodes = requestedModalityCodes.filter(
    (code): code is string => typeof code === "string" && code.trim().length > 0
  );

  let query = supabase
    .from("ai_jobs")
    .select(
      "id,status,provider_code,provider_job_id,metadata_json,created_at,cost_actual_credits,cost_estimated_credits,input_params_json,modality_code,model_slug_at_submit,error_message,seed,share_slug,share_visit_count,share_conversion_count,public_title,public_summary,public_assets",
      { count: "exact" }
    )
    .eq("user_id", userId);

  if (modalityCodes.length > 0) {
    query = query.in("modality_code", modalityCodes);
  }

  const { data: jobs, error: jobsError, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (jobsError) {
    throw jobsError;
  }

  const jobIds = (jobs ?? []).map((job) => job.id);

  let outputsByJob = new Map<string, CreationOutput[]>();

  if (jobIds.length > 0) {
    const { data: outputs, error: outputsError } = await supabase
      .from("ai_job_outputs")
      .select("id, job_id, url, thumb_url, type, created_at")
      .in("job_id", jobIds)
      .order("created_at", { ascending: true });

    if (outputsError) {
      throw outputsError;
    }

    outputsByJob = (outputs ?? []).reduce((acc, output) => {
      if (!output.job_id) {
        return acc;
      }
      const list = acc.get(output.job_id) ?? [];
      list.push({
        id: output.id,
        url: output.url,
        thumbUrl: output.thumb_url,
        type: output.type,
        createdAt: output.created_at,
      });
      acc.set(output.job_id, list);
      return acc;
    }, new Map<string, CreationOutput[]>());
  }

  const items: CreationItem[] = (jobs ?? []).map((job) => {
    const metadata = (job.metadata_json ?? {}) as Record<string, any>;
    const inputParams = (job.input_params_json ?? {}) as Record<string, any>;
    const outputs = outputsByJob.get(job.id) ?? [];
    const isImageToImage = Boolean(metadata.is_image_to_image) || (metadata.reference_image_count ?? 0) > 0;
    const latestStatus = (metadata.freepik_latest_status as string | undefined) ?? null;
    const estimatedCost = typeof job.cost_estimated_credits === "number" ? job.cost_estimated_credits : 0;
    const metadataCost = typeof metadata.credits_cost === "number" ? Number(metadata.credits_cost) : undefined;
    const actualCost = typeof job.cost_actual_credits === "number" ? job.cost_actual_credits : undefined;
    const costCredits = actualCost ?? metadataCost ?? estimatedCost;

    return {
      jobId: job.id,
      providerCode: job.provider_code,
      providerJobId: job.provider_job_id,
      status: job.status,
      latestStatus,
      createdAt: job.created_at,
      costCredits,
      outputs,
      metadata,
      inputParams,
      modalityCode: job.modality_code,
      modelSlug: job.model_slug_at_submit,
      errorMessage: job.error_message,
      seed: job.seed,
      isImageToImage,
      referenceImageCount: metadata.reference_image_count ?? 0,
      shareSlug: job.share_slug ?? null,
      shareVisitCount: job.share_visit_count ?? 0,
      shareConversionCount: job.share_conversion_count ?? 0,
      publicTitle: job.public_title ?? null,
      publicSummary: job.public_summary ?? null,
    };
  });

  return {
    items,
    totalCount: count ?? 0,
  };
}
