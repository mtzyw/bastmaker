AI Schema Index Plan and Naming Conventions

Overview
- Purpose: Define indexes and naming conventions for the new AI domain schema to ensure scalable reads and consistent data modeling without hard constraints.
- Scope: ai_providers, ai_modalities, ai_models, ai_model_versions, ai_jobs, ai_job_inputs, ai_job_outputs, ai_job_events, ai_tags, ai_model_tags, and credit_logs.related_job_id.

Index Plan

1) ai_providers
- idx_ai_providers_code: btree(provider_code)
  Rationale: Fast lookup by provider code for routing/config.

2) ai_modalities
- idx_ai_modalities_code: btree(modality_code)
  Rationale: Filter models/jobs by capability type (t2i/i2i/t2v/i2v/...).

3) ai_models
- idx_ai_models_slug: btree(model_slug)
  Rationale: Resolve human-readable model identifiers.
- idx_ai_models_provider_modality: btree(provider_code, modality_code)
  Rationale: Filter/organize models by provider and modality.
- idx_ai_models_display_order: btree(display_order)
  Rationale: Stable ordering in UI.
Optional (on demand): GIN(lang_jsonb), GIN on tags (if moved to jsonb) for full-text/tag searches.

4) ai_model_versions
- idx_ai_model_versions_model_label: btree(model_id, version_label)
  Rationale: Resolve a specific version for a model quickly.
- idx_ai_model_versions_status_scope: btree(status, visibility_scope)
  Rationale: Publish/test filtering and releases.
- idx_ai_model_versions_provider_key: btree(provider_model_key)
  Rationale: Map to provider-side identifier (webhook/status queries).
Optional: btree(activated_at), btree(deprecated_at) if querying by lifecycle dates.

5) ai_jobs
- idx_ai_jobs_user_created_at: btree(user_id, created_at DESC)
  Rationale: User history pages with reverse chronology.
- idx_ai_jobs_status: btree(status)
  Rationale: Operational dashboards/queues.
- idx_ai_jobs_version: btree(model_version_id)
  Rationale: Aggregate/track per version usage.
- idx_ai_jobs_modality: btree(modality_code)
  Rationale: Segmentation by capability.
- idx_ai_jobs_provider_job_id: btree(provider_job_id)
  Rationale: Webhook/status reconciliation.
Optional: Partial indexes by status if queues get large.

6) ai_job_inputs
- idx_ai_job_inputs_job: btree(job_id)
- idx_ai_job_inputs_job_index: btree(job_id, index)
  Rationale: Multi-input retrieval in stable order.

7) ai_job_outputs
- idx_ai_job_outputs_job: btree(job_id)
- idx_ai_job_outputs_job_index: btree(job_id, index)
- idx_ai_job_outputs_job_created: btree(job_id, created_at DESC)
  Rationale: Fetch latest outputs efficiently; grid views.
Optional: btree(expires_at) if using TTL/cleanup jobs.

8) ai_job_events
- idx_ai_job_events_job: btree(job_id)
- idx_ai_job_events_job_created: btree(job_id, created_at)
  Rationale: Timeline queries per job.

9) ai_tags / ai_model_tags
- Common case needs no additional indexes beyond PK on (model_id, tag_id).
Optional: btree(tag_code) on ai_tags for admin lookups.

10) credit_logs
- idx_credit_logs_related_job_id: btree(related_job_id)
  Rationale: Back-reference credit adjustments from a job.

Naming Conventions

General
- snake_case for all table and column names.
- Use text/jsonb/numeric/timestamptz/bool for flexibility; avoid enums/CHECK unless you explicitly want strict validation.
- Timestamps: created_at, updated_at; job runtime also includes started_at, completed_at.

Codes and Slugs
- provider_code: lowercase short code (e.g., replicate, openai, kling). Keep human-readable and stable.
- modality_code: lowercase short code (e.g., t2i, i2i, t2v, i2v). Extend with new codes as needed.
- model_slug: human-readable stable identifier for a conceptual model (e.g., kling/i2v). Do not include version; version resides in ai_model_versions.version_label.
- version_label: free-text (e.g., 2025-09-10, v1.3.2). Avoid strict formats to preserve flexibility; validate in application.

JSON Columns
- input_schema_json/output_schema_json: JSON Schema-like documents for form building and validation.
- default_params_json: Reasonable default parameters for UI.
- limits_json: Hard/soft caps (resolution/time/fps/etc.).
- cost_formula_json: Declarative charging rules (e.g., { base: 10, per_mp: 2, per_second: 5 }).
- provider_extra_json: Provider routing details (fine-tune IDs, cluster hints, etc.).
- usage_metrics_json: Observed metrics for billing (frames/duration/resolution/etc.).
- pricing_snapshot_json: Captured at submission time for later reconciliation.

Keys and References
- Use uuid PK everywhere (gen_random_uuid()) for simplicity.
- Do not enforce FKs; store uuid/text codes and resolve at application level. This prevents write-time failures due to referential drift.
- Where historical fidelity matters (jobs), store snapshot fields: model_slug_at_submit, input_schema_version_at_submit, pricing_schema_version_at_submit.

Visibility and Lifecycle
- status and visibility_scope in ai_model_versions are free-text; manage allowed values in application config (admin UI).
- Lifecycle stamps: activated_at, deprecated_at, hidden_at; use for operational reporting or timed rollouts.
- For job/gallery display, use is_public + visibility (public/logged_in/subscribers) aligned with your existing content gating.

Performance and Storage
- Add only the indexes listed above; defer GIN or specialized indexes until search/filter needs become clear.
- Consider periodic cleanup of large blobs via ai_job_outputs.expires_at and background jobs.

Security (Optional RLS)
- Keep RLS simple: users can read their own ai_jobs/inputs/outputs/events; admin has full access. Model/version tables can be public read or admin-only per your release strategy.
- Authorization and input validation belong in the application layer; database stays flexible.

