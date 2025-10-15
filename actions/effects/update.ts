"use server";

import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { actionResponse } from "@/lib/action-response";
import { revalidatePath } from "next/cache";

// Zod schema for form validation - must include the ID for updates
const updateEffectSchema = z.object({
  id: z.string().uuid("Invalid ID"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  provider_code: z.literal("freepik"),
  provider_model: z.string().min(1, "Provider model is required"),
  pricing_credits_override: z.coerce.number().int().min(0).default(25),
  display_order: z.coerce.number().int().default(0),
  
  // Params for metadata_json.freepik_params
  prompt: z.string().min(1, "Prompt is required"),
  duration: z.union([z.string(), z.coerce.number()]),
  resolution: z.string(),

  // Params for metadata_json.pageContent
  preview_video_url: z.string().url("Invalid URL format").or(z.literal('')),
  mainVideoUrl: z.string().url("Invalid URL format").or(z.literal('')).optional(),
  detailVideoUrls: z.array(z.string().url("Invalid URL format").or(z.literal(''))).optional(),

  // Other metadata
  model_display_name: z.string().min(1, "Model display name is required"),
});

export async function updateVideoEffect(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  // Coerce array-like form data into an array for the detailVideoUrls
  const detailUrls = Array.from({ length: 7 }, (_, i) => rawData[`detailVideoUrls.${i}`]).filter(Boolean) as string[];
  const processedData = { ...rawData, detailVideoUrls: detailUrls };

  const validation = updateEffectSchema.safeParse(processedData);

  if (!validation.success) {
    const error = validation.error.flatten().fieldErrors;
    console.error("[UpdateEffectAction] Validation failed:", error);
    return actionResponse.error("Invalid form data", { error });
  }

  const data = validation.data;

  try {
    const supabase = getServiceRoleClient();

    // Check if slug already exists on a *different* item
    const { data: existing, error: existingError } = await supabase
      .from("video_effect_templates")
      .select("id")
      .eq("slug", data.slug)
      .not("id", "eq", data.id)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return actionResponse.error(`Slug '${data.slug}' is already in use by another effect.`);
    }

    // Construct the metadata_json object
    const metadata_json = {
      model_display_name: data.model_display_name,
      freepik_params: {
        prompt: data.prompt,
        duration: data.duration,
        resolution: data.resolution,
      },
      pageContent: {
        mainVideoUrl: data.mainVideoUrl,
        detailVideoUrls: data.detailVideoUrls,
      },
    };

    // Update the record in the database
    const { error: updateError } = await supabase
      .from("video_effect_templates")
      .update({
        slug: data.slug,
        title: data.title,
        description: data.description,
        category: data.category,
        provider_code: data.provider_code,
        provider_model: data.provider_model,
        pricing_credits_override: data.pricing_credits_override,
        display_order: data.display_order,
        preview_video_url: data.preview_video_url,
        metadata_json: metadata_json as any,
        // Note: is_active is not updated via this form for now
      })
      .eq("id", data.id);

    if (updateError) {
      throw updateError;
    }

    // Revalidate the path to ensure the list shows fresh data
    revalidatePath("/dashboard/effects");

    return actionResponse.success({ slug: data.slug });

  } catch (error: any) {
    console.error("[UpdateEffectAction] Error:", error.message);
    return actionResponse.error("Failed to update video effect.");
  }
}
