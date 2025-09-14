-- Email OTP pending registrations (flexible schema, RLS enabled, no public access)

CREATE TABLE IF NOT EXISTS public.auth_email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  code_hash text,
  purpose text, -- e.g., 'signup' | 'login'
  payload_json jsonb NOT NULL DEFAULT '{}', -- can hold username, password_hash, etc.
  attempts int NOT NULL DEFAULT 0,
  status text, -- 'pending' | 'used' | 'expired'
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_email_otps ENABLE ROW LEVEL SECURITY;

-- No public policies; use service role to insert/select/update.

CREATE INDEX IF NOT EXISTS idx_auth_email_otps_email_created ON public.auth_email_otps(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_email_otps_expires_at ON public.auth_email_otps(expires_at);

