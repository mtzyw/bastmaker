"use server";

import { z } from "zod";
import { TEXT_TO_IMAGE_MODEL_OPTIONS } from "@/components/ai/text-image-models";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { actionResponse } from "@/lib/action-response";

const MODEL_LABEL_BY_SLUG = new Map(
  TEXT_TO_IMAGE_MODEL_OPTIONS.map((option) => [
    option.apiValue ?? option.value,
    option.label,
  ])
);

const formSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  description: z.string().optional(),
  provider_model: z.string().min(1),
  pricing_credits_override: z.coerce.number().int().min(0).default(6),
  display_order: z.coerce.number().int().default(0),
  preview_image_url: z.string().url().optional(),
  prompt: z.string().min(1),
  mainImageUrl: z.string().url().optional(),
  detailImageUrls: z
    .array(z.string().url("Invalid URL format"))
    .optional(),
});

export async function updateImageEffect(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const detailUrls = Array.from({ length: 6 }, (_, idx) =>
    raw[`detailImageUrls.${idx}`]
  ).filter(Boolean) as string[];

  const parsed = formSchema.safeParse({
    ...raw,
    detailImageUrls: detailUrls,
  });

  if (!parsed.success) {
    const error = parsed.error.flatten().fieldErrors;
    console.error("[UpdateImageEffect] validation failed", error);
    return actionResponse.error("Invalid form data", "validation_error");
  }

  const data = parsed.data;
  const modelDisplayName =
    MODEL_LABEL_BY_SLUG.get(data.provider_model) ?? data.provider_model;

  try {
    const supabase = getServiceRoleClient();

    const metadata_json = {
      model_display_name: modelDisplayName,
      freepik_params: {
        prompt: data.prompt,
      },
      pageContent: {
        mainImageUrl: data.mainImageUrl ?? null,
        detailImageUrls:
          data.detailImageUrls && data.detailImageUrls.length > 0
            ? data.detailImageUrls
            : undefined,
      },
    };

    const updatePayload = {
      slug: data.slug,
      title: data.title,
      description: data.description,
      provider_model: data.provider_model,
      pricing_credits_override: data.pricing_credits_override,
      display_order: data.display_order,
      preview_image_url: data.preview_image_url,
      metadata_json: metadata_json as any,
    };

    const { error: updateError } = await supabase
      .from("image_effect_templates")
      .update(updatePayload)
      .eq("id", data.id);

    if (updateError) {
      throw updateError;
    }

    return actionResponse.success({ id: data.id });
  } catch (error: any) {
    console.error("[UpdateImageEffect] Error:", error?.message ?? error);
    return actionResponse.error("Failed to update image effect.");
  }
}
