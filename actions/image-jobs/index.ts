"use server";

import { actionResponse } from "@/lib/action-response";
import { isAdmin } from "@/lib/supabase/isAdmin";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/types";
import { createClient as createAdminClient, SupabaseClient } from '@supabase/supabase-js';

export type ImageJob = Database["public"]["Tables"]["image_jobs"]["Row"];

interface GetImageJobsParams {
  pageIndex?: number;
  pageSize?: number;
  filter?: string;
  featureId?: string;
  isPublic?: 'all' | 'true' | 'false';
  statuses?: Database['public']['Enums']['job_status'][];
  locale?: string;
}

export interface GetImageJobsResult {
  success: boolean;
  data?: {
    jobs: ImageJob[];
    totalCount: number;
    hasMore: boolean;
  };
  error?: string;
}

interface GetImageJobsCoreParams extends GetImageJobsParams {
  supabaseClient: SupabaseClient<Database>;
  userId?: string;
}

async function _getImageJobs({
  pageIndex = 0,
  pageSize = 20,
  filter,
  featureId,
  isPublic = 'all',
  statuses,
  userId,
  supabaseClient
}: GetImageJobsCoreParams) {

  const start = pageIndex * pageSize;
  const end = start + pageSize - 1;

  let query = supabaseClient
    .from('image_jobs')
    .select('*', { count: 'exact' });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (featureId) {
    query = query.eq('feature_id', featureId);
  }

  if (statuses && statuses.length > 0) {
    query = query.in('status', statuses);
  }

  if (filter) {
    const trimmedFilter = filter.trim();
    const isNumeric = /^\d+$/.test(trimmedFilter);

    if (isNumeric) {
      query = query.or(`final_seed_used.eq.${trimmedFilter}`);
    } else {
      query = query.filter('provider_job_id', 'ilike', `%${trimmedFilter}%`);
    }
  }

  if (isPublic !== 'all') {
    query = query.eq('is_public', isPublic === 'true');
  }

  query = query
    .order('created_at', { ascending: false })
    .range(start, end);

  const { data: jobs, error, count } = await query;

  if (error) {
    console.error('Failed to fetch image jobs:', error);
    throw new Error('Failed to fetch image jobs');
  }

  const totalCount = count || 0;
  const hasMore = totalCount > start + pageSize;

  return {
    jobs: jobs || [],
    totalCount,
    hasMore,
  };
}


export async function getImageJobsUser({
  pageIndex = 0,
  pageSize = 20,
  filter,
  featureId,
  isPublic = 'all',
  statuses,
}: GetImageJobsParams): Promise<GetImageJobsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return actionResponse.unauthorized();
  }

  try {
    const result = await _getImageJobs({
      pageIndex,
      pageSize,
      filter,
      featureId,
      isPublic,
      statuses,
      userId: user.id,
      supabaseClient: supabase,
    });

    return actionResponse.success(result);
  } catch (e) {
    const error = e as Error;
    console.error("Failed to fetch image jobs for user:", error);
    return actionResponse.error(error.message);
  }
}

export async function getImageJobsAdmin({
  pageIndex = 0,
  pageSize = 20,
  filter,
  featureId,
  isPublic = 'all',
  statuses,
}: GetImageJobsParams): Promise<GetImageJobsResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }

  const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const result = await _getImageJobs({
      pageIndex,
      pageSize,
      filter,
      featureId,
      isPublic,
      statuses,
      supabaseClient: supabaseAdmin,
    });
    return actionResponse.success(result);
  } catch (e) {
    const error = e as Error;
    console.error('Error fetching image jobs for admin:', error);
    return actionResponse.error(error.message);
  }
} 