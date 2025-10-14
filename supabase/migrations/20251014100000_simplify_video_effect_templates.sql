ALTER TABLE public.video_effect_templates
DROP COLUMN IF EXISTS default_prompt,
DROP COLUMN IF EXISTS negative_prompt,
DROP COLUMN IF EXISTS duration_seconds,
DROP COLUMN IF EXISTS resolution,
DROP COLUMN IF EXISTS aspect_ratio,
DROP COLUMN IF EXISTS cfg_scale,
DROP COLUMN IF EXISTS seed,
DROP COLUMN IF EXISTS mode,
DROP COLUMN IF EXISTS modality_code;
