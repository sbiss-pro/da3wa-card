
-- Drop overly permissive update policy
DROP POLICY IF EXISTS "Public update rsvp" ON public.guests;

-- Fix function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Secure RSVP update via token
CREATE OR REPLACE FUNCTION public.submit_rsvp(
  p_token text,
  p_status text,
  p_companions int,
  p_notes text
) RETURNS public.guests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest public.guests;
BEGIN
  IF p_status NOT IN ('accepted','declined') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE public.guests
    SET rsvp_status = p_status,
        companions_count = GREATEST(0, LEAST(COALESCE(p_companions, 0), 20)),
        notes = NULLIF(p_notes, '')
  WHERE token = p_token
  RETURNING * INTO v_guest;
  IF v_guest.id IS NULL THEN
    RAISE EXCEPTION 'Guest not found';
  END IF;
  RETURN v_guest;
END; $$;

GRANT EXECUTE ON FUNCTION public.submit_rsvp(text,text,int,text) TO anon, authenticated;
