
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS companion_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS attended_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.scan_logs
  ADD COLUMN IF NOT EXISTS attended_count integer,
  ADD COLUMN IF NOT EXISTS partial boolean NOT NULL DEFAULT false;
