-- 1) Remove plaintext password storage
ALTER TABLE public.coordinators DROP COLUMN IF EXISTS password_plain;

-- 2) Add server-side session expiry (8h TTL enforced in code)
ALTER TABLE public.coordinators ADD COLUMN IF NOT EXISTS session_expires_at timestamptz;

-- 3) Hide session_token (and session_expires_at) from authenticated reads via column-level grants.
--    The host UI never needs the raw session token; service_role still has full access for the auth helper.
REVOKE SELECT ON public.coordinators FROM authenticated;
GRANT SELECT (id, event_id, name, username, last_login_at, created_at, updated_at)
  ON public.coordinators TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coordinators TO authenticated;

-- 4) Guest token-based RLS for self-service (defense in depth alongside our service-role server fns).
--    Anonymous callers can only read/update their own row, and only when the request sets
--    the GUC app.guest_token (otherwise current_setting returns NULL and no rows match).
GRANT SELECT (id, token, name, rsvp_status, companions_count, notes, event_id, checked_in_at)
  ON public.guests TO anon;
GRANT UPDATE (rsvp_status, companions_count, notes) ON public.guests TO anon;

DROP POLICY IF EXISTS "Guests can read own row via token" ON public.guests;
CREATE POLICY "Guests can read own row via token"
  ON public.guests FOR SELECT TO anon
  USING (token IS NOT NULL AND token = current_setting('app.guest_token', true));

DROP POLICY IF EXISTS "Guests can update own RSVP via token" ON public.guests;
CREATE POLICY "Guests can update own RSVP via token"
  ON public.guests FOR UPDATE TO anon
  USING (token IS NOT NULL AND token = current_setting('app.guest_token', true))
  WITH CHECK (token IS NOT NULL AND token = current_setting('app.guest_token', true));

-- 5) Server-side URL scheme validation for event.location_url to block javascript:/data: XSS.
CREATE OR REPLACE FUNCTION public.validate_event_urls()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.location_url IS NOT NULL AND NEW.location_url <> '' AND NEW.location_url !~* '^https?://' THEN
    RAISE EXCEPTION 'location_url must start with http:// or https://';
  END IF;
  -- Also strip CR/LF from text fields to prevent calendar/header injection at the source.
  IF NEW.name IS NOT NULL THEN NEW.name := regexp_replace(NEW.name, '[\r\n]+', ' ', 'g'); END IF;
  IF NEW.location IS NOT NULL THEN NEW.location := regexp_replace(NEW.location, '[\r\n]+', ' ', 'g'); END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS events_validate_urls ON public.events;
CREATE TRIGGER events_validate_urls
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.validate_event_urls();
