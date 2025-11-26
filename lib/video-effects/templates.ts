import { getServiceRoleClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

export type VideoEffectInputConfig = {
  id: string;
  slot: string;
  type: string;
  isRequired: boolean;
  minResolution: string | null;
  aspectRatioHint: string | null;
  maxSizeMb: number | null;
  instructions: string | null;
  metadata: Record<string, any>;
  displayOrder: number;
};

export type VideoEffectPageContent = {
  mainVideoUrl?: string;
  detailVideoUrls?: string[];
};

export type VideoEffectTemplate = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  previewVideoUrl: string | null;
  previewCoverUrl: string | null;
  modalityCode: string;
  providerCode: string;
  providerModel: string;
  durationSeconds: number | null;
  resolution: string | null;
  aspectRatio: string | null;
  mode: string | null;
  cfgScale: number | null;
  seed: number | null;
  pricingCreditsOverride: number | null;
  defaultPrompt: string | null;
  negativePrompt: string | null;
  promptVariables: any[];
  metadata: {
    pageContent?: VideoEffectPageContent;
    [key: string]: any;
  };
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  inputs: VideoEffectInputConfig[];
};

function mapTemplateRow(
  row: Database["public"]["Tables"]["video_effect_templates"]["Row"]
): Omit<VideoEffectTemplate, "inputs"> {
  const extendedRow = row as Database["public"]["Tables"]["video_effect_templates"]["Row"] & {
    modality_code?: string | null;
    duration_seconds?: number | null;
    resolution?: string | null;
    aspect_ratio?: string | null;
    mode?: string | null;
    cfg_scale?: number | null;
    seed?: number | null;
    default_prompt?: string | null;
    negative_prompt?: string | null;
  };

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    previewVideoUrl: row.preview_video_url,
    previewCoverUrl: row.preview_cover_url,
    modalityCode: extendedRow.modality_code ?? "i2v",
    providerCode: row.provider_code ?? "freepik",
    providerModel: row.provider_model,
    durationSeconds: extendedRow.duration_seconds ?? null,
    resolution: extendedRow.resolution ?? null,
    aspectRatio: extendedRow.aspect_ratio ?? null,
    mode: extendedRow.mode ?? null,
    cfgScale: extendedRow.cfg_scale ?? null,
    seed: extendedRow.seed ?? null,
    pricingCreditsOverride: row.pricing_credits_override,
    defaultPrompt: extendedRow.default_prompt ?? null,
    negativePrompt: extendedRow.negative_prompt ?? null,
    promptVariables: Array.isArray(row.prompt_variables) ? row.prompt_variables : [],
    metadata: (row.metadata_json ?? {}) as Record<string, any>,
    isActive: row.is_active ?? true,
    displayOrder: row.display_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInputRow(
  row: Database["public"]["Tables"]["video_effect_inputs"]["Row"]
): VideoEffectInputConfig {
  return {
    id: row.id,
    slot: row.slot,
    type: row.type,
    isRequired: row.is_required ?? true,
    minResolution: row.min_resolution,
    aspectRatioHint: row.aspect_ratio_hint,
    maxSizeMb: row.max_size_mb,
    instructions: row.instructions,
    metadata: (row.metadata_json ?? {}) as Record<string, any>,
    displayOrder: row.display_order ?? 0,
  };
}

export async function fetchVideoEffectTemplate(slug: string): Promise<VideoEffectTemplate | null> {
  const supabase = getServiceRoleClient();

  const { data: template, error: templateError } = await supabase
    .from("video_effect_templates")
    .select("*")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();

  if (templateError) {
    console.error("[video-effects] failed to load template", { slug, error: templateError });
    throw templateError;
  }

  if (!template || template.is_active === false) {
    return null;
  }

  const { data: inputs, error: inputError } = await supabase
    .from("video_effect_inputs")
    .select("*")
    .eq("template_id", template.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (inputError) {
    console.error("[video-effects] failed to load inputs", { slug, error: inputError });
    throw inputError;
  }

  return {
    ...mapTemplateRow(template),
    inputs: (inputs ?? []).map(mapInputRow),
  };
}

export async function listActiveVideoEffects(): Promise<VideoEffectTemplate[]> {
  const supabase = getServiceRoleClient();

  const { data: templates, error } = await supabase
    .from("video_effect_templates")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[video-effects] failed to list templates", error);
    throw error;
  }

  if (!templates || templates.length === 0) {
    return [];
  }

  const templateIds = templates.map((item) => item.id);
  const { data: inputs, error: inputsError } = await supabase
    .from("video_effect_inputs")
    .select("*")
    .in("template_id", templateIds);

  if (inputsError) {
    console.error("[video-effects] failed to load template inputs", inputsError);
    throw inputsError;
  }

  const groupedInputs = new Map<string, VideoEffectInputConfig[]>();
  (inputs ?? []).forEach((row) => {
    const list = groupedInputs.get(row.template_id) ?? [];
    list.push(mapInputRow(row));
    groupedInputs.set(row.template_id, list);
  });

  return templates.map((template) => ({
    ...mapTemplateRow(template),
    inputs: (groupedInputs.get(template.id) ?? []).sort((a, b) => a.displayOrder - b.displayOrder),
  }));
}
