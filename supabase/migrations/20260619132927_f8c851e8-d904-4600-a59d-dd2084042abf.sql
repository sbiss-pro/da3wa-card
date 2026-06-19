
-- Lock down public/auth read access on events and guests; remove SECURITY DEFINER RPC.
-- Guest invitation page will now go through server functions (service role) that filter by token server-side.

DROP POLICY IF EXISTS "Auth can read events" ON public.events;
DROP POLICY IF EXISTS "Public can read events by slug" ON public.events;
DROP POLICY IF EXISTS "Public read guest auth" ON public.guests;
DROP POLICY IF EXISTS "Public read guest by token" ON public.guests;

-- Drop the publicly-executable SECURITY DEFINER RPC; replaced by a server function.
DROP FUNCTION IF EXISTS public.submit_rsvp(text, text, integer, text);

-- Revoke any lingering anon/authenticated table grants for safety; host access uses policies + authenticated grants already in place via service role / host policies.
REVOKE SELECT ON public.events FROM anon;
REVOKE SELECT ON public.guests FROM anon;
