-- Migration: create image effect template tables
-- Generated on: 2025-10-20

CREATE TABLE IF NOT EXISTS public.image_effect_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  category text,
  preview_image_url text,
  provider_code text NOT NULL DEFAULT 'freepik',
  provider_model text NOT NULL,
  pricing_credits_override numeric,
  prompt_variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS image_effect_templates_slug_idx
  ON public.image_effect_templates (slug);

CREATE INDEX IF NOT EXISTS image_effect_templates_category_idx
  ON public.image_effect_templates (category);

CREATE TABLE IF NOT EXISTS public.image_effect_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.image_effect_templates(id) ON DELETE CASCADE,
  slot text NOT NULL,
  type text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  max_size_mb integer,
  instructions text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS image_effect_inputs_template_slot_idx
  ON public.image_effect_inputs (template_id, slot);

CREATE INDEX IF NOT EXISTS image_effect_inputs_template_idx
  ON public.image_effect_inputs (template_id);
