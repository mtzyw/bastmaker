import { NextResponse } from "next/server";

import { fetchImageEffectTemplate } from "@/lib/image-effects/templates";
import { getImageEffectBySlug } from "@/lib/image-effects/effects";

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
    const template = await fetchImageEffectTemplate(slug);
    if (template) {
      return NextResponse.json({ success: true, data: template });
    }

    const fallback = getImageEffectBySlug(slug);
    if (fallback) {
      return NextResponse.json({ success: true, data: fallback });
    }

    return NextResponse.json(
      { success: false, error: "Effect not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("[api/image-effects] failed to load template", { slug, error });
    return NextResponse.json(
      { success: false, error: "Failed to load image effect template" },
      { status: 500 }
    );
  }
}
