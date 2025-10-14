"use server";

import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { actionResponse } from "@/lib/action-response";

// Zod schema for form validation
const createEffectSchema = z.object({
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
  preview_video_url: z.string().url("Invalid URL format"),
  mainVideoUrl: z.string().url("Invalid URL format"),
  detailVideoUrls: z.array(z.string().url("Invalid URL format")).length(7, "You must provide 7 detail video URLs"),

  // Other metadata
  model_display_name: z.string().min(1, "Model display name is required"),
});

export async function createVideoEffect(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  // Coerce array-like form data into an array for the detailVideoUrls
  const detailUrls = Array.from({ length: 7 }, (_, i) => rawData[`detailVideoUrls.${i}`]).filter(Boolean) as string[];
  const processedData = { ...rawData, detailVideoUrls: detailUrls };

  const validation = createEffectSchema.safeParse(processedData);

  if (!validation.success) {
    const error = validation.error.flatten().fieldErrors;
    console.error("[CreateEffectAction] Validation failed:", error);
    return actionResponse.error("Invalid form data", { error });
  }

  const data = validation.data;

  try {
    const supabase = getServiceRoleClient();

    // Check if slug already exists
    const { data: existing, error: existingError } = await supabase
      .from("video_effect_templates")
      .select("id")
      .eq("slug", data.slug)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return actionResponse.error(`Slug '${data.slug}' already exists.`);
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

    // Insert into the database
    const { error: insertError } = await supabase.from("video_effect_templates").insert({
      slug: data.slug,
      title: data.title,
      description: data.description,
      category: data.category,
      provider_code: data.provider_code,
      provider_model: data.provider_model,
      pricing_credits_override: data.pricing_credits_override,
      is_active: true, // Set default value here
      display_order: data.display_order,
      preview_video_url: data.preview_video_url,
      metadata_json: metadata_json as any, // Cast to any to avoid deep type issues with Supabase client
      prompt_variables: [], // Defaulting to empty array
    });

    if (insertError) {
      throw insertError;
    }

    return actionResponse.success({ slug: data.slug });

  } catch (error: any) {
    console.error("[CreateEffectAction] Error:", error.message);
    return actionResponse.error("Failed to create video effect.");
  }
}
