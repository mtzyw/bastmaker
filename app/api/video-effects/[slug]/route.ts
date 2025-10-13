import { NextResponse } from "next/server";

import { fetchVideoEffectTemplate } from "@/lib/video-effects/templates";

type RouteParams = Promise<{ slug: string }>;

export async function GET(_request: Request, { params }: { params: RouteParams }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { success: false, error: "Missing effect slug" },
      { status: 400 }
    );
  }

  try {
    const template = await fetchVideoEffectTemplate(slug);
    if (!template) {
      return NextResponse.json(
        { success: false, error: "Effect not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error("[api/video-effects] failed to load template", { slug, error });
    return NextResponse.json(
      { success: false, error: "Failed to load video effect template" },
      { status: 500 }
    );
  }
}
