import { fetchUserCreations, getDefaultPageSize } from "@/lib/ai/creations";
import { apiResponse } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const DEFAULT_PAGE_SIZE = getDefaultPageSize();

function parseNumber(value: string | null, fallback: number, opts?: { min?: number; max?: number }) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  let result = Math.floor(parsed);
  if (opts?.min !== undefined && result < opts.min) result = opts.min;
  if (opts?.max !== undefined && result > opts.max) result = opts.max;
  return result;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiResponse.unauthorized("Authentication required");
  }

  const { searchParams } = req.nextUrl;
  const page = parseNumber(searchParams.get("page"), 0, { min: 0 });
  const pageSize = parseNumber(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE, { min: 1, max: 60 });

  try {
    const result = await fetchUserCreations(supabase, user.id, page, pageSize);
    const hasMore = result.items.length + page * pageSize < result.totalCount;

    return apiResponse.success({
      items: result.items,
      totalCount: result.totalCount,
      page,
      pageSize,
      hasMore,
    });
  } catch (error: any) {
    console.error("[my-creations] failed to fetch items", error);
    return apiResponse.serverError("Failed to load creations");
  }
}
