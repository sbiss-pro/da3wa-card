-- Replace email-based super-admin identification with a private allowlist table.
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE TABLE IF NOT EXISTS private.super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE private.super_admins FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE private.super_admins TO service_role;

-- Seed the current super admin from user_roles / auth if present.
INSERT INTO private.super_admins (user_id)
SELECT id FROM auth.users WHERE lower(email) = 'saeedbiss@hotmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Rewrite is_super_admin to consult the allowlist instead of the email column.
CREATE OR REPLACE FUNCTION private.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = private, public AS $$
  SELECT EXISTS (SELECT 1 FROM private.super_admins WHERE user_id = _user_id)
$$;
REVOKE ALL ON FUNCTION private.is_super_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_super_admin(uuid) TO authenticated, service_role;

-- Expose a safe checker for the current user only (no arbitrary lookup).
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = private, public AS $$
  SELECT EXISTS (SELECT 1 FROM private.super_admins WHERE user_id = auth.uid())
$$;
REVOKE ALL ON FUNCTION public.is_current_user_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_super_admin() TO authenticated, service_role;