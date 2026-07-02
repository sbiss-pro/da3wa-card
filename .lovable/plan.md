# خطة التنفيذ الشاملة

## 1) قاعدة البيانات (Migration)

### جدول `site_content` — محتوى الصفحة الرئيسية الديناميكي
- `id` (singleton = 'home')
- `sections` (JSONB) — مصفوفة أقسام مرتّبة، كل قسم يحوي: `key`, `type` (hero/stats/features/testimonials/cta/gallery/text)، `visible`, `order`, `data` (نصوص/أرقام/صور/روابط)
- `theme` (JSONB) — ألوان العلامة (primary, accent, background, foreground, gold, emerald)، الخطوط
- `branding` (JSONB) — اسم الموقع، الشعار، رقم الواتساب
- `updated_by`, `updated_at`

RLS:
- قراءة: `anon` + `authenticated` (المحتوى عام)
- كتابة: فقط `has_role(auth.uid(), 'admin')` أو `has_role(auth.uid(), 'editor')`

### إضافة دور `editor` لـ enum `app_role`
- `ALTER TYPE app_role ADD VALUE 'editor'`

### دالة `is_super_admin(uid)` 
- تُرجع true فقط لبريد `saeedbiss@hotmail.com` (تُقرأ من `auth.users.email`)
- SECURITY DEFINER, search_path=public

### تعديل `user_roles`
- سياسة: Super Admin وحده يستطيع INSERT/UPDATE/DELETE على الأدوار
- سياسة قراءة: كل مستخدم يقرأ دوره + Super Admin يقرأ الجميع

### Seed
- إدراج صف افتراضي في `site_content` بمحتوى الصفحة الحالية

## 2) Server Functions (`src/lib/admin.functions.ts`)

- `getSiteContent` — عام (بدون auth) لجلب محتوى الصفحة الرئيسية
- `updateSiteContent` — محمي بـ `requireSupabaseAuth` + تحقق من دور admin/editor
- `listUsers` — Super Admin فقط، عبر `supabaseAdmin.auth.admin.listUsers()`
- `assignRole` / `revokeRole` — Super Admin فقط (تحقق `is_super_admin`)
- `getMyPermissions` — يُرجع `{ isSuperAdmin, isAdmin, isEditor }`

كل الدوال المميزة تتحقق من الدور داخل الـ handler، ولا يُستورد `client.server` إلا داخل الـ handler عبر `await import`.

## 3) لوحة Super Admin (`/_authenticated/admin/*`)

### التوجيه
- `admin/route.tsx` — layout يتحقق من `isSuperAdmin` أو `isEditor`؛ غير المصرح يُحوَّل لـ `/dashboard`
- `admin/index.tsx` — نظرة عامة (عدد المستخدمين، الفعاليات، آخر التعديلات)
- `admin/users.tsx` — Super Admin فقط: قائمة المستخدمين + تعيين/سحب أدوار (admin/editor/user)
- `admin/homepage.tsx` — محرر الصفحة الرئيسية الشامل

### محرر الصفحة الرئيسية (`admin/homepage.tsx`)
تبويبات:
1. **الأقسام (Sections)**: قائمة بالسحب والإفلات (drag & drop) — إعادة ترتيب، إخفاء/إظهار، إضافة/حذف. لكل قسم فورم حسب نوعه:
   - Hero: عنوان، وصف، زر CTA، صورة خلفية
   - Stats: مصفوفة (رقم + تسمية)
   - Features: مصفوفة (أيقونة/صورة + عنوان + وصف)
   - Testimonials: مصفوفة اقتباسات
   - Gallery: مصفوفة صور
   - Text/CTA حر
2. **الألوان والعلامة (Theme)**: color pickers لكل متغيّر (primary, accent, gold, emerald, background, foreground) + معاينة حيّة
3. **العلامة التجارية (Branding)**: اسم الموقع، رقم الواتساب، الشعار
4. **معاينة (Preview)**: iframe لـ `/` مع refresh key

زر "حفظ التغييرات" يُرسل الحالة كاملة عبر `updateSiteContent`.

## 4) الصفحة الرئيسية الديناميكية (`src/routes/index.tsx`)

- Loader يستدعي `getSiteContent()` (يعمل SSR)
- يُصيّر الأقسام بالترتيب حسب `order` + `visible`
- ألوان الـ theme تُحقن عبر `<style>` inline بمتغيرات CSS على `:root` (يتجاوز `styles.css` للألوان الديناميكية فقط)
- كل قسم مكوّن مستقل: `<HeroSection>`, `<StatsSection>`, `<FeaturesSection>`... إلخ
- fallback لمحتوى افتراضي عند فشل التحميل

## 5) إصلاحات وحماية

- فحص كل الروابط: `/auth` مخفي، أزرار WhatsApp تعمل، روابط footer صحيحة
- التأكد من أن `/admin/*` غير مفهرس (`robots.txt` + meta noindex)
- تقييد `updateSiteContent` بتحقق مزدوج (middleware + دور)
- منع Super Admin من سحب دوره الخاص
- التأكد من أن قراءة `site_content` بواسطة `anon` تُرجع فقط الحقول العامة (لا تحوي أسرار)
- ربط `/owner/9x2k7q4mvp-invitly-2026` بتحقق إضافي: بعد الدخول، إن لم يكن Super Admin يظهر خطأ

## 6) الوصول (UX)

- Super Admin يرى زر "لوحة الإدارة" في `/dashboard`
- Editor يرى زر "تحرير الصفحة الرئيسية" فقط
- كل النصوص عربية RTL، متسقة مع الهوية الحالية (INVITLY، الذهبي/الزمرّدي)

## التفاصيل التقنية

- Migration واحد يحوي: enum alter, is_super_admin, site_content, RLS/GRANTs, seed
- `admin.functions.ts` يستخدم `requireSupabaseAuth` + `has_role` RPC + `supabaseAdmin` (dynamic import) لعمليات auth.admin
- Theme dynamic: `<style>{`:root{--primary:${theme.primary};...}`}</style>` في `__root.tsx` أو `index.tsx`
- drag & drop: `@dnd-kit/core` + `@dnd-kit/sortable` (تثبيت جديد)
- Color picker: مكوّن HTML `<input type="color">` مغلّف بواجهة عربية
- عند تحميل الصفحة الرئيسية، تُخزَّن ألوان الـ theme في CSS variables وتُطبَّق فوراً بدون flash

هذه خطة كبيرة لكن مترابطة. عند الموافقة سأنفّذها على دفعة migration + كود موحّدة.