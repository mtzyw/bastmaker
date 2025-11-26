import { NextResponse } from "next/server";

import { getViewerJobBySlug } from "@/actions/ai-jobs/public";
import { createClient } from "@/lib/supabase/server";

type RouteParams = Promise<{ slug: string }>;

export async function GET(
  _request: Request,
  { params }: { params: RouteParams }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ success: false, error: "Missing slug" }, { status: 400 });
  }

  let userId: string | undefined;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? undefined;
  } catch {
    userId = undefined;
  }

  const result = await getViewerJobBySlug(slug, { allowPrivateForUserId: userId });

  if (!result.success) {
    const status = result.customCode === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ success: false, error: result.error ?? "Failed to load" }, { status });
  }

  if (!result.data) {
    return NextResponse.json({ success: false, error: "Failed to load" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}
