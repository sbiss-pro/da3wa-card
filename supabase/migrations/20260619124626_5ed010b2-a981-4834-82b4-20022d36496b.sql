
-- Events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 10),
  name text NOT NULL,
  event_type text NOT NULL DEFAULT 'wedding',
  event_date timestamptz NOT NULL,
  location text,
  location_url text,
  description text,
  template_config jsonb NOT NULL DEFAULT '{"template":"gold","bg_color":"#f7f1e6","text_color":"#1a1410","accent_color":"#c9a24a","font":"amiri","custom_title":"","custom_message":"","image_url":""}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts manage own events" ON public.events FOR ALL TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Public can read events by slug" ON public.events FOR SELECT TO anon USING (true);
CREATE POLICY "Auth can read events" ON public.events FOR SELECT TO authenticated USING (true);

-- Guests table
CREATE TABLE public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 16),
  name text NOT NULL,
  phone text,
  email text,
  rsvp_status text NOT NULL DEFAULT 'pending' CHECK (rsvp_status IN ('pending','accepted','declined','attended')),
  companions_count int NOT NULL DEFAULT 0,
  notes text,
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX guests_event_idx ON public.guests(event_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO authenticated;
GRANT SELECT, UPDATE ON public.guests TO anon;
GRANT ALL ON public.guests TO service_role;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage guests of own events" ON public.guests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = guests.event_id AND e.host_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = guests.event_id AND e.host_id = auth.uid()));

CREATE POLICY "Public read guest by token" ON public.guests FOR SELECT TO anon USING (true);
CREATE POLICY "Public read guest auth" ON public.guests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public update rsvp" ON public.guests FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER guests_updated_at BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
