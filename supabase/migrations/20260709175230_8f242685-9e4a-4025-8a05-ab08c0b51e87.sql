CREATE OR REPLACE FUNCTION public.admin_check_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = private, public AS $$
  SELECT EXISTS (SELECT 1 FROM private.super_admins WHERE user_id = _user_id)
$$;
REVOKE ALL ON FUNCTION public.admin_check_super_admin(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_check_super_admin(uuid) TO service_role;