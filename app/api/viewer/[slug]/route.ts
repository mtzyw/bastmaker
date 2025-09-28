import { NextResponse } from "next/server";

import { getViewerJobBySlug } from "@/actions/ai-jobs/public";

type RouteParams = Promise<{ slug: string }>;

export async function GET(
  _request: Request,
  { params }: { params: RouteParams }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ success: false, error: "Missing slug" }, { status: 400 });
  }

  const result = await getViewerJobBySlug(slug);

  if (!result.success || !result.data) {
    const status = result.customCode === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ success: false, error: result.error ?? "Failed to load" }, { status });
  }

  return NextResponse.json({ success: true, data: result.data });
}
