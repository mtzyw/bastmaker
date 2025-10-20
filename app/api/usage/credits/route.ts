import { NextResponse } from "next/server";

import { getDetailedSubscriptionInfo } from "@/actions/usage/benefits";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        success: true,
        data: {
          credits: 0,
          label: "Free",
        },
      },
      { status: 200 }
    );
  }

  try {
    const info = await getDetailedSubscriptionInfo(user.id);
    const credits = info.totalAvailableCredits ?? 0;
    const label =
      info.plan?.card_title ??
      (info.subscriptionStatus === "trialing"
        ? "Trial"
        : info.subscriptionStatus === "active"
          ? "Member"
          : "Free");

    return NextResponse.json({
      success: true,
      data: {
        credits,
        label,
      },
    });
  } catch (error) {
    console.error("[usage-credits] failed to fetch credits", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load credits",
      },
      { status: 500 }
    );
  }
}
