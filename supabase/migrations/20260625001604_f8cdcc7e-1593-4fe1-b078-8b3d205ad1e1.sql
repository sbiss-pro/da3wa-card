
-- Add honorific title + RSVP override history columns to guests
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS original_rsvp_status text,
  ADD COLUMN IF NOT EXISTS original_companions_count integer,
  ADD COLUMN IF NOT EXISTS host_overridden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes_seen_at timestamptz;

-- Scan logs for live coordinator -> host syncing of QR check-ins
CREATE TABLE IF NOT EXISTS public.scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  coordinator_id uuid REFERENCES public.coordinators(id) ON DELETE SET NULL,
  coordinator_name text NOT NULL,
  guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  status text NOT NULL DEFAULT 'checked_in',
  scanned_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.scan_logs TO authenticated;
GRANT ALL ON public.scan_logs TO service_role;

ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts read scan logs of own events" ON public.scan_logs;
CREATE POLICY "Hosts read scan logs of own events" ON public.scan_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = scan_logs.event_id AND e.host_id = auth.uid()));

CREATE INDEX IF NOT EXISTS scan_logs_event_idx ON public.scan_logs(event_id, scanned_at DESC);

ALTER TABLE public.scan_logs REPLICA IDENTITY FULL;
ALTER TABLE public.guests REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'scan_logs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_logs';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'guests'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.guests';
  END IF;
END $$;
