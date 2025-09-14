import { getSeedFromReplicateLogs } from "@/lib/ai/getSeed";
import { apiResponse } from "@/lib/api-response";
import { generateR2Key, serverUploadFile } from "@/lib/cloudflare/r2";
import { Database } from "@/lib/supabase/types";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { NextRequest } from "next/server";

const supabaseAdmin = createAdminClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(_req: NextRequest) {
  // Feature disabled: Replicate webhook handling is turned off.
  return apiResponse.notFound('AI image generation is disabled.');
} 
