
-- Add 'owner' role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';

-- Add owner_user_id to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_owner_user_id ON public.events(owner_user_id);

-- Allow assigned event owner to read their event (read-only)
DROP POLICY IF EXISTS "Event owner can view assigned events" ON public.events;
CREATE POLICY "Event owner can view assigned events"
ON public.events
FOR SELECT
TO authenticated
USING (owner_user_id = auth.uid());

-- Allow assigned event owner to read guests of their events (read-only)
DROP POLICY IF EXISTS "Event owner can view guests of assigned events" ON public.guests;
CREATE POLICY "Event owner can view guests of assigned events"
ON public.guests
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = guests.event_id AND e.owner_user_id = auth.uid()
));

-- Allow assigned event owner to read scan_logs of their events (read-only)
DROP POLICY IF EXISTS "Event owner can view scan_logs of assigned events" ON public.scan_logs;
CREATE POLICY "Event owner can view scan_logs of assigned events"
ON public.scan_logs
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = scan_logs.event_id AND e.owner_user_id = auth.uid()
));
