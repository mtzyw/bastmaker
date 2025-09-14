import { DEFAULT_LOCALE } from "@/i18n/routing";
import { apiResponse } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, _ctx: { params: Promise<{ job_id: string }> }) {
  // Feature disabled: Replicate job status endpoint is turned off.
  return apiResponse.notFound('AI image generation is disabled.');
} 
