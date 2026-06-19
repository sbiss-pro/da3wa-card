CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.coordinators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  session_token text,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coordinators TO authenticated;
GRANT ALL ON public.coordinators TO service_role;

ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage coordinators of own events"
ON public.coordinators FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid()));

CREATE TRIGGER coordinators_updated_at
BEFORE UPDATE ON public.coordinators
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
