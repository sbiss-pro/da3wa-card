
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id AND lower(email) = 'saeedbiss@hotmail.com'
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_super_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_super_admin(uuid) TO authenticated, service_role;

-- Recreate policies against private.* helpers
DROP POLICY IF EXISTS "site_content writable by editors and admins" ON public.site_content;
CREATE POLICY "site_content writable by editors and admins"
ON public.site_content FOR UPDATE
TO authenticated
USING (
  private.is_super_admin(auth.uid())
  OR private.has_role(auth.uid(), 'admin')
  OR private.has_role(auth.uid(), 'editor')
)
WITH CHECK (
  private.is_super_admin(auth.uid())
  OR private.has_role(auth.uid(), 'admin')
  OR private.has_role(auth.uid(), 'editor')
);

DROP POLICY IF EXISTS "site_content insertable by super admin" ON public.site_content;
CREATE POLICY "site_content insertable by super admin"
ON public.site_content FOR INSERT
TO authenticated
WITH CHECK (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "user_roles_select_own_or_super" ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_super"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "user_roles_super_admin_write" ON public.user_roles;
CREATE POLICY "user_roles_super_admin_write"
ON public.user_roles FOR ALL
TO authenticated
USING (private.is_super_admin(auth.uid()))
WITH CHECK (private.is_super_admin(auth.uid()));

-- Drop the exposed helpers so the API can no longer invoke them
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
