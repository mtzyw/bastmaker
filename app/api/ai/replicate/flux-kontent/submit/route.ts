import { deductCredits } from "@/actions/usage/deduct";
import { featureList } from "@/config/featureList";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import replicate from "@/lib/ai/replicate";
import { apiResponse } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { z } from "zod";
import { translateAndOptimizePrompt } from "./prompt-optimizer";

const submitJobSchema = z.object({
  feature_id: z.string().min(1),
  parameters: z.record(z.any()),
  seed: z.number().int().optional(),
});

async function triggerReplicateJob(jobId: string, feature_id: string, parameters: Record<string, any>, seed: number | undefined, webhookUrl: string) {
  const supabase = await createClient();
  const feature = featureList[feature_id];

  if (!replicate) {
    throw new Error("Replicate is not initialized");
  }

  try {
    const finalSeed = seed ?? feature.default_seed;

    const prediction = await replicate.predictions.create({
      model: feature.model,
      input: {
        ...parameters,
        seed: finalSeed,
        safety_tolerance: 2.0,
      },
      webhook: webhookUrl,
      webhook_events_filter: ["completed"]
    });

    await supabase
      .from("image_jobs")
      .update({
        provider_job_id: prediction.id,
        status: 'processing',
        final_seed_used: finalSeed,
      })
      .eq("id", jobId);

  } catch (error: any) {
    console.error(`[Job ${jobId}] Failed to trigger Replicate job:`, error);
    await supabase
      .from("image_jobs")
      .update({
        status: 'failed',
        error_message: `Failed to start AI model: ${error.message}`,
      })
      .eq("id", jobId);
  }
}

export async function POST(_req: NextRequest) {
  // Feature disabled: Replicate integration is currently turned off.
  return apiResponse.notFound('AI image generation is disabled.');
} 
