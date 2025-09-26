import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { consumeShareAttributionForUser } from "@/lib/share/consume";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ consumed: false, reason: "unauthenticated" }, { status: 401 });
  }

  const store = await cookies();
  const result = await consumeShareAttributionForUser(user.id, { store });

  return NextResponse.json(result, { status: result.consumed ? 200 : 202 });
}
