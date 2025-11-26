import { getServiceRoleClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

export type ImageEffectInputConfig = {
  id: string;
  slot: string;
  type: string;
  isRequired: boolean;
  maxSizeMb: number | null;
  instructions: string | null;
  metadata: Record<string, any>;
  displayOrder: number;
};

export type ImageEffectPageContent = {
  mainImageUrl?: string;
  previewImageUrl?: string;
  detailImageUrls?: string[];
};

export type ImageEffectTemplate = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  previewImageUrl: string | null;
  providerCode: string;
  providerModel: string;
  pricingCreditsOverride: number | null;
  promptVariables: any[];
  metadata: {
    pageContent?: ImageEffectPageContent;
    [key: string]: any;
  };
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  inputs: ImageEffectInputConfig[];
};

function mapTemplateRow(
  row: Database["public"]["Tables"]["image_effect_templates"]["Row"]
): Omit<ImageEffectTemplate, "inputs"> {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    previewImageUrl: row.preview_image_url,
    providerCode: row.provider_code ?? "freepik",
    providerModel: row.provider_model,
    pricingCreditsOverride: row.pricing_credits_override,
    promptVariables: Array.isArray(row.prompt_variables)
      ? row.prompt_variables
      : [],
    metadata: (row.metadata_json ?? {}) as Record<string, any>,
    isActive: row.is_active ?? true,
    displayOrder: row.display_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInputRow(
  row: Database["public"]["Tables"]["image_effect_inputs"]["Row"]
): ImageEffectInputConfig {
  return {
    id: row.id,
    slot: row.slot,
    type: row.type,
    isRequired: row.is_required ?? true,
    maxSizeMb: row.max_size_mb,
    instructions: row.instructions,
    metadata: (row.metadata_json ?? {}) as Record<string, any>,
    displayOrder: row.display_order ?? 0,
  };
}

export async function fetchImageEffectTemplate(
  slug: string
): Promise<ImageEffectTemplate | null> {
  const supabase = getServiceRoleClient();

  const { data: template, error: templateError } = await supabase
    .from("image_effect_templates")
    .select("*")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();

  if (templateError) {
    console.error("[image-effects] failed to load template", {
      slug,
      error: templateError,
    });
    throw templateError;
  }

  if (!template || template.is_active === false) {
    return null;
  }

  const { data: inputs, error: inputError } = await supabase
    .from("image_effect_inputs")
    .select("*")
    .eq("template_id", template.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (inputError) {
    console.error("[image-effects] failed to load inputs", {
      slug,
      error: inputError,
    });
    throw inputError;
  }

  return {
    ...mapTemplateRow(template),
    inputs: (inputs ?? []).map(mapInputRow),
  };
}

export async function listActiveImageEffects(): Promise<ImageEffectTemplate[]> {
  const supabase = getServiceRoleClient();

  const { data: templates, error } = await supabase
    .from("image_effect_templates")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[image-effects] failed to list templates", error);
    throw error;
  }

  if (!templates || templates.length === 0) {
    return [];
  }

  const templateIds = templates.map((item) => item.id);
  const { data: inputs, error: inputsError } = await supabase
    .from("image_effect_inputs")
    .select("*")
    .in("template_id", templateIds);

  if (inputsError) {
    console.error("[image-effects] failed to load template inputs", inputsError);
    throw inputsError;
  }

  const groupedInputs = new Map<string, ImageEffectInputConfig[]>();
  (inputs ?? []).forEach((row) => {
    const list = groupedInputs.get(row.template_id) ?? [];
    list.push(mapInputRow(row));
    groupedInputs.set(row.template_id, list);
  });

  return templates.map((template) => ({
    ...mapTemplateRow(template),
    inputs:
      (groupedInputs.get(template.id) ?? []).sort(
        (a, b) => a.displayOrder - b.displayOrder
      ),
  }));
}
