
-- === 1) is_super_admin function ===
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id AND lower(email) = 'saeedbiss@hotmail.com'
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;

-- === 2) site_content table ===
CREATE TABLE IF NOT EXISTS public.site_content (
  id text PRIMARY KEY,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_content readable by everyone"
ON public.site_content FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "site_content writable by editors and admins"
ON public.site_content FOR UPDATE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'editor')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'editor')
);

CREATE POLICY "site_content insertable by super admin"
ON public.site_content FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- === 3) user_roles policies: super admin manages ===
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_super_admin_all" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;

CREATE POLICY "user_roles_select_own_or_super"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "user_roles_super_admin_write"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- === 4) Seed default homepage content ===
INSERT INTO public.site_content (id, sections, theme, branding)
VALUES (
  'home',
  '[
    {"key":"hero","type":"hero","visible":true,"order":0,"data":{
      "eyebrow":"INVITLY",
      "title":"دعوات فاخرة تليق بمناسباتكم الاستثنائية",
      "subtitle":"منصة INVITLY لإدارة الدعوات الفاخرة وتأكيد الحضور، بلمسة زمرّدية ذهبية تعكس رقي حدثك.",
      "ctaLabel":"اطلب خدمتك عبر واتساب",
      "ctaHref":"https://wa.me/966500000000?text=%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%AE%D8%AF%D9%85%D8%A9%20INVITLY"
    }},
    {"key":"stats","type":"stats","visible":true,"order":1,"data":{
      "items":[
        {"value":"+٥٠٠","label":"مناسبة مُدارة"},
        {"value":"+٢٠٠٠","label":"ضيف مؤكَّد"},
        {"value":"٩٩٪","label":"رضا العملاء"},
        {"value":"٢٤/٧","label":"دعم مباشر"}
      ]
    }},
    {"key":"features","type":"features","visible":true,"order":2,"data":{
      "title":"لماذا INVITLY؟",
      "subtitle":"تجربة رقمية فاخرة لكل تفاصيل مناسبتك",
      "items":[
        {"title":"بطاقات مخصّصة","desc":"تصميم بطاقة دعوة فاخرة بألوانك وخطوطك."},
        {"title":"تأكيد حضور ذكي","desc":"إدارة الردود والمرافقين تلقائياً."},
        {"title":"مسح QR فوري","desc":"دخول سريع ومنظّم يوم الحفل."},
        {"title":"دعم واتساب","desc":"مساعد شخصي على مدار الساعة."}
      ]
    }},
    {"key":"cta","type":"cta","visible":true,"order":3,"data":{
      "title":"جاهز لتقديم دعوة استثنائية؟",
      "subtitle":"تواصل معنا الآن عبر واتساب لبدء إعداد بطاقتك.",
      "ctaLabel":"ابدأ الآن",
      "ctaHref":"https://wa.me/966500000000"
    }}
  ]'::jsonb,
  '{
    "primary":"#0f3d2e",
    "accent":"#c8a24a",
    "background":"#faf7f0",
    "foreground":"#111827",
    "gold":"#c8a24a",
    "emerald":"#0f3d2e"
  }'::jsonb,
  '{
    "siteName":"INVITLY",
    "whatsappNumber":"966500000000",
    "logoUrl":""
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
