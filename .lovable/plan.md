# خطة: فصل تسجيلات الدخول وأدوار الأحداث + قيود إنشاء الحسابات

## 1) صفحات تسجيل دخول منفصلة (روابط سرية)

- **المدير الأعلى (Super Admin)** — فقط `saeedbiss@hotmail.com`.
  - رابط سري جديد فقط: `/owner/9x2k7q4mvp-invitly-2026` يقود إلى صفحة تسجيل دخول مستقلة `/sa-login` (مخفية، `noindex`، لا روابط لها).
  - عند الدخول: إن كان البريد ≠ حساب المدير الأعلى → رفض فوري ورسالة "غير مصرح".
  - صفحة `/auth` العامة السابقة تُلغى كواجهة دخول عامة (redirect → الصفحة الرئيسية). فقط الروابط السرية أدناه تصل إلى تسجيل الدخول.

- **المنسّق (Coordinator)** — صفحة مستقلة على رابط سري جديد:
  - `/c-portal/7h3n2r8w-coord` → `/c/login` (نموذج المنسّق الحالي).
  - إخفاء كامل من الواجهة العامة (لا روابط، `noindex`).

- **مالك الحدث (Event Owner)** — صفحة مستقلة برابط سري:
  - `/o-portal/5m9p4t6q-owner` → `/o/login` تسجيل دخول Supabase (email/password) خاص فقط بمالكي الأحداث.
  - رفض أي حساب لا يمتلك دور `owner`.

- سيتم عرض الروابط الثلاثة السرية لك في الشات فقط.

## 2) الأدوار (RBAC)

- توسيع `app_role` بإضافة `owner` (بالإضافة للأدوار الحالية: `admin`, `editor`, `user`, `coordinator`).
- المدير الأعلى يُحدَّد حصراً بالبريد `saeedbiss@hotmail.com` عبر الدالة الموجودة `is_super_admin()`.
- إسناد جدول `events` لحقل جديد `owner_user_id uuid` (FK → `auth.users`) بجانب المنسّق الحالي.
- المنسّق: يعمل فقط على أحداثه (كما هو الآن) — لا تغيير.
- المالك: يقرأ فقط إحصائيات أحداثه المسندة.

## 3) لوحة مالك الحدث (قراءة فقط)

- `/_authenticated/owner` (SSR off) — تُعرض فقط إن كان للمستخدم دور `owner`.
- هيكل الصفحة جاهز لعرض إحصائيات لكل حدث مسنَد: عدد الدعوات، المؤكدون، الحضور الفعلي (سيُعبَّأ لاحقاً بالبيانات التي ستزوّدنا بها).
- لا أزرار إنشاء/تعديل/حذف مطلقاً.

## 4) قيود إنشاء الحسابات

- **Supabase Auth**: تعطيل التسجيل العام (`disable_signup=true`).
- إزالة تبويب "إنشاء حساب" من كل صفحات الدخول.
- المدير الأعلى فقط يستطيع من `/admin/users`:
  - إنشاء حساب (admin/editor/coordinator/owner) عبر `supabaseAdmin.auth.admin.createUser`.
  - تعديل/تفعيل/تعطيل/حذف الحسابات.
  - إسناد/سحب الأدوار.
- كل الدوال المميزة تتحقق من `is_super_admin()` قبل التنفيذ.

## 5) الأمان و RBAC على مستوى المسارات

- `beforeLoad` على كل مسار محمي يستدعي `getMyPermissions` ويوجّه:
  - `/admin/*` → super admin / admin / editor فقط.
  - `/owner/*` (Event Owner) → دور `owner` فقط.
  - `/dashboard`, `/events/*` → المستخدم صاحب الحدث فقط.
  - المنسّق يبقى على `/c/*` بجلسته الحالية.
- سياسات RLS جديدة/محدَّثة:
  - `events`: SELECT للمالك عندما `owner_user_id = auth.uid()`.
  - `guests`, `scan_logs`: SELECT للمالك عبر ربطها بأحداثه (قراءة فقط، لا INSERT/UPDATE/DELETE).
- منع تصعيد الصلاحيات: لا يمكن لأي دور غير Super Admin الكتابة على `user_roles`.
- `robots.txt`: منع فهرسة كل الروابط السرية والصفحات المحمية.

## تفاصيل تقنية

**ملفات جديدة:**
- `src/routes/sa-login.tsx` — دخول المدير الأعلى (يتحقق من البريد بعد الدخول).
- `src/routes/o.login.tsx` — دخول المالك.
- `src/routes/o-portal.$key.tsx`, `src/routes/c-portal.$key.tsx` — بوابات سرية.
- `src/routes/_authenticated/owner/route.tsx` + `owner/index.tsx` — لوحة المالك (read-only).
- `src/lib/owner.functions.ts` — قراءة إحصائيات أحداث المالك.
- توسعة `src/lib/admin.functions.ts` بـ `createUser`, `deleteUser`, `setUserActive`.

**تعديلات:**
- `src/routes/auth.tsx` → redirect إلى `/`.
- `src/routes/index.tsx`, `src/components/site-footer.tsx` → إزالة أي روابط دخول.
- `src/routes/_authenticated/admin/users.tsx` → إضافة إنشاء/حذف/تعطيل + إسناد دور `owner`.
- migration: إضافة `owner` للـ enum، `events.owner_user_id`، سياسات RLS للمالك، دالة `has_any_role`.
- `supabase--configure_auth` → `disable_signup=true`.

**الروابط السرية النهائية (سأعرضها لك في الرد بعد التنفيذ):**
- Super Admin: `/owner/9x2k7q4mvp-invitly-2026` (نفس السري الحالي)
- Coordinator portal: مفتاح جديد
- Owner portal: مفتاح جديد

هل أبدأ التنفيذ بهذه الخطة؟
