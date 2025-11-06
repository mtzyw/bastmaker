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

export async function createImageEffect(formData: FormData) {
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
    console.error("[CreateImageEffect] validation failed", error);
    return actionResponse.error("Invalid form data", "validation_error");
  }

  const data = parsed.data;
  const modelDisplayName =
    MODEL_LABEL_BY_SLUG.get(data.provider_model) ?? data.provider_model;

  try {
    const supabase = getServiceRoleClient();

    const { data: existing, error: existingError } = await supabase
      .from("image_effect_templates")
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

    const insertPayload = {
      slug: data.slug,
      title: data.title,
      description: data.description,
      provider_code: "freepik",
      provider_model: data.provider_model,
      pricing_credits_override: data.pricing_credits_override,
      display_order: data.display_order,
      preview_image_url: data.preview_image_url,
      metadata_json: metadata_json as any,
      prompt_variables: [],
      is_active: true,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("image_effect_templates")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    const primaryInput = {
      template_id: inserted.id,
      slot: "primary",
      type: "image",
      is_required: true,
      metadata_json: {
        instructions: "上传主体图片，建议分辨率大于 1024×1024。",
      },
    };

    const { error: inputError } = await supabase
      .from("image_effect_inputs")
      .insert(primaryInput);

    if (inputError && inputError.code !== "23505") {
      console.error("[CreateImageEffect] failed to insert inputs", inputError);
    }

    return actionResponse.success({ slug: data.slug });
  } catch (error: any) {
    console.error("[CreateImageEffect] Error:", error?.message ?? error);
    return actionResponse.error("Failed to create image effect.");
  }
}
