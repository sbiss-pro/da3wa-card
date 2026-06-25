
DROP POLICY IF EXISTS "Guests can read own row via token" ON public.guests;
DROP POLICY IF EXISTS "Guests can update own RSVP via token" ON public.guests;

CREATE POLICY "Hosts insert scan logs for own events"
ON public.scan_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = scan_logs.event_id AND e.host_id = auth.uid()
  )
);
