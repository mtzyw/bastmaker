"use server";

import { actionResponse } from "@/lib/action-response";
import { fetchUserCreations } from "@/lib/ai/creations";
import { createClient } from "@/lib/supabase/server";

interface GetUserCreationsHistoryParams {
  pageIndex?: number;
  pageSize?: number;
  modalityCodes?: string[];
}

export async function getUserCreationsHistory({
  pageIndex = 0,
  pageSize = 10,
  modalityCodes,
}: GetUserCreationsHistoryParams) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return actionResponse.unauthorized("Authentication required");
  }

  try {
    const result = await fetchUserCreations(supabase, user.id, pageIndex, pageSize, {
      modalityCodes,
    });

    const hasMore =
      result.items.length + pageIndex * pageSize < result.totalCount;

    return actionResponse.success({
      items: result.items,
      totalCount: result.totalCount,
      page: pageIndex,
      pageSize,
      hasMore,
    });
  } catch (error) {
    console.error("[actions:getUserCreationsHistory] failed", error);
    return actionResponse.error("Failed to load generation history");
  }
}
