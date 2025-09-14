import replicate from "@/lib/ai/replicate";
import { apiResponse } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(_req: NextRequest, _ctx: { params: Promise<{ job_id: string }> }) {
  // Feature disabled: Replicate job cancellation is turned off.
  return apiResponse.notFound('AI image generation is disabled.');
} 
