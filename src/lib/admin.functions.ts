import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

export type SiteSection = {
  key: string;
  type: "hero" | "stats" | "features" | "cta" | "text" | "testimonials" | "gallery";
  visible: boolean;
  order: number;
  data: { [k: string]: JsonValue };
};

export type SiteTheme = {
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  gold: string;
  emerald: string;
};

export type SiteBranding = {
  siteName: string;
  whatsappNumber: string;
  logoUrl: string;
};

export type SiteSocial = {
  twitter: string;
  instagram: string;
  email: string;
  phone: string;
};

export type SitePage = {
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
};

export type SitePages = {
  about: SitePage;
  contact: SitePage;
  privacy: SitePage;
  terms: SitePage;
};

export type SiteWhatsApp = {
  senderName: string;
  imageUrl: string;
  initialMessage: string;
  eventDay: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventLocationUrl: string;
  visible: boolean;
  messageSuggestions: { label: string; body: string }[];
};

export type SiteCommercial = {
  crNumber: string;
  vatNumber: string;
  address: string;
  workHours: string;
  entityName: string;
  supportEmail: string;
};

export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight: boolean;
  ctaLabel: string;
  ctaHref: string;
};

export type SitePricing = {
  eyebrow: string;
  title: string;
  subtitle: string;
  plans: PricingPlan[];
  note: string;
};

export type SiteRefund = SitePage;

export type SiteContent = {
  sections: SiteSection[];
  theme: SiteTheme;
  branding: SiteBranding;
  social: SiteSocial;
  pages: SitePages;
  whatsapp: SiteWhatsApp;
  commercial: SiteCommercial;
  pricing: SitePricing;
  refund: SiteRefund;
  updated_at?: string;
};

const DEFAULT_CONTENT: SiteContent = {
  sections: [
    {
      key: "hero",
      type: "hero",
      visible: true,
      order: 0,
      data: {
        eyebrow: "INVITLY",
        title: "دعوات فاخرة تليق بمناسباتكم الاستثنائية",
        subtitle:
          "منصة INVITLY لإدارة الدعوات الفاخرة وتأكيد الحضور، بلمسة زمرّدية ذهبية تعكس رقي حدثك.",
        ctaLabel: "اطلب خدمتك عبر واتساب",
        ctaHref: "https://wa.me/966500000000",
      },
    },
  ],
  theme: {
    primary: "#0f3d2e",
    accent: "#c8a24a",
    background: "#faf7f0",
    foreground: "#111827",
    gold: "#c8a24a",
    emerald: "#0f3d2e",
  },
  branding: { siteName: "INVITLY", whatsappNumber: "966500000000", logoUrl: "" },
  social: {
    twitter: "https://twitter.com/invitly",
    instagram: "https://instagram.com/invitly",
    email: "hello@invitly.app",
    phone: "+966110000000",
  },
  pages: {
    about: {
      eyebrow: "ABOUT US",
      title: "من نحن",
      subtitle: "قصة INVITLY وشغفنا بصناعة تجارب دعوات فاخرة.",
      body: "INVITLY منصة سعودية متخصصة في إدارة الدعوات الرقمية الفاخرة.\n\nنقدم تجربة متكاملة من تصميم البطاقة، وإرسال الدعوات عبر واتساب، وتأكيد الحضور، إلى إدارة قوائم الضيوف في لوحة واحدة أنيقة.\n\nهدفنا أن تتفرغ لضيوفك وتترك التفاصيل علينا.",
    },
    contact: {
      eyebrow: "CONTACT US",
      title: "تواصل معنا",
      subtitle: "نحن هنا لمساعدتك — اختر القناة الأنسب لك وسنرد خلال ساعات العمل.",
      body: "ساعات العمل: الأحد – الخميس، ٩ صباحاً – ٦ مساءً.\n\nللاستفسارات العامة راسلنا عبر البريد أو واتساب.\nللدعم الفني اتصل بالرقم أعلاه.",
    },
    privacy: {
      eyebrow: "PRIVACY POLICY",
      title: "سياسة الخصوصية",
      subtitle: "نضع خصوصية بياناتك وبيانات ضيوفك في مقدمة أولوياتنا.",
      body: "١. البيانات التي نجمعها\nبيانات الحساب: الاسم، البريد الإلكتروني، رقم الجوال.\nبيانات الفعالية: الاسم، التاريخ، الموقع، الوصف.\nبيانات الضيوف: الاسم، رقم الجوال، حالة الرد.\n\n٢. كيف نستخدم بياناتك\nتقديم خدمة الدعوات وإدارة قوائم المدعوين.\nإرسال إشعارات الدعوات والتذكيرات عبر واتساب.\nتحسين تجربة المستخدم وأداء المنصة.\n\n٣. مشاركة البيانات\nلا نبيع بياناتك لأي طرف ثالث.\n\n٤. أمان البيانات\nنستخدم اتصالات مشفرة (HTTPS) وحماية RLS على قاعدة البيانات.\n\n٥. حقوقك\nيمكنك طلب نسخة من بياناتك، تصحيحها، أو حذفها في أي وقت.",
    },
    terms: {
      eyebrow: "TERMS OF SERVICE",
      title: "الشروط والأحكام",
      subtitle: "باستخدامك للمنصة فإنك توافق على الشروط التالية.",
      body: "١. قبول الشروط\nإنشاؤك حساباً أو استخدامك لأي من خدماتنا يعني موافقتك على هذه الشروط.\n\n٢. الاستخدام المسموح\nيُسمح باستخدام المنصة لإدارة الدعوات فقط، ويُمنع أي استخدام غير قانوني.\n\n٣. الملكية الفكرية\nجميع الحقوق الفكرية للمنصة محفوظة لـ INVITLY.\n\n٤. المسؤولية\nالمنظم مسؤول عن دقة البيانات التي يدخلها وعن التواصل مع ضيوفه.\n\n٥. التعديلات\nنحتفظ بحق تعديل الشروط في أي وقت مع إشعار المستخدمين.",
    },
  },
  whatsapp: {
    senderName: "INVITLY",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
    initialMessage:
      "السلام عليكم أستاذ محمد،\nيسعدنا دعوتكم لحضور مناسبتنا.\nرابط دعوتكم: https://invitly.app/i/demo",
    eventDay: "يوم الجمعة",
    eventDate: "١٥ / ٠٨ / ٢٠٢٦",
    eventTime: "٩:٠٠ مساءً",
    eventLocation: "قاعة الأمير سلطان — الرياض",
    eventLocationUrl: "https://maps.google.com/?q=Riyadh",
    visible: true,
    messageSuggestions: [
      {
        label: "رسمي أنيق",
        body:
          "السلام عليكم [اللقب] [اسم_الضيف]\nيشرّفنا حضوركم مناسبتنا الخاصة.\n\n↗ افتح دعوتك\n[رابط_الدعوة]",
      },
      {
        label: "ودّي مختصر",
        body:
          "[اسم_الضيف] 💌\nدعوتك جاهزة — نتشرف بحضورك.\n[رابط_الدعوة]",
      },
      {
        label: "احتفالي فاخر",
        body:
          "بكل الفخر نتشرف بدعوتكم\n[اللقب] [اسم_الضيف] ✨\nتفاصيل المناسبة داخل بطاقتكم الرقمية.\n[رابط_الدعوة]",
      },
      {
        label: "تذكير لطيف",
        body:
          "تذكير بمناسبتنا [اسم_الضيف] 🌿\nنسعد بتأكيد حضوركم عبر الرابط.\n[رابط_الدعوة]",
      },
    ],
  },
  commercial: {
    entityName: "مؤسسة INVITLY للدعوات الرقمية",
    crNumber: "",
    vatNumber: "",
    address: "المملكة العربية السعودية — الرياض",
    workHours: "الأحد – الخميس، ٩ صباحاً – ٦ مساءً",
    supportEmail: "support@invitly.app",
  },
  pricing: {
    eyebrow: "PRICING",
    title: "باقات تناسب مناسبتك",
    subtitle: "أسعار شفافة بدون رسوم مخفية. جميع الأسعار شاملة ضريبة القيمة المضافة.",
    note: "الأسعار بالريال السعودي. للحجز أو تخصيص باقة تواصل معنا عبر واتساب.",
    plans: [
      {
        id: "basic",
        name: "الأساسية",
        price: "٢٩٩",
        period: "لكل مناسبة",
        description: "مناسبة للمناسبات الصغيرة حتى ١٠٠ مدعو.",
        features: [
          "بطاقة دعوة رقمية فاخرة",
          "رابط دعوة مخصص لكل ضيف",
          "تأكيد الحضور RSVP",
          "لوحة تحكم للمنظم",
          "دعم فني عبر واتساب",
        ],
        highlight: false,
        ctaLabel: "احجز الأساسية",
        ctaHref: "https://wa.me/966500000000?text=%D8%A7%D9%84%D8%A8%D8%A7%D9%82%D8%A9%20%D8%A7%D9%84%D8%A3%D8%B3%D8%A7%D8%B3%D9%8A%D8%A9",
      },
      {
        id: "pro",
        name: "الاحترافية",
        price: "٥٩٩",
        period: "لكل مناسبة",
        description: "الأكثر طلباً — حتى ٣٠٠ مدعو مع دخول QR.",
        features: [
          "كل مزايا الباقة الأساسية",
          "استخراج ألوان تلقائي من صورة الدعوة",
          "حضور بمسح QR + وضع أوفلاين",
          "حساب منسق مستقل",
          "تصدير قوائم Excel",
          "أولوية في الدعم",
        ],
        highlight: true,
        ctaLabel: "احجز الاحترافية",
        ctaHref: "https://wa.me/966500000000?text=%D8%A7%D9%84%D8%A8%D8%A7%D9%82%D8%A9%20%D8%A7%D9%84%D8%A7%D8%AD%D8%AA%D8%B1%D8%A7%D9%81%D9%8A%D8%A9",
      },
      {
        id: "vip",
        name: "VIP",
        price: "١٬٢٩٩",
        period: "لكل مناسبة",
        description: "للمناسبات الكبرى — عدد مدعوين غير محدود.",
        features: [
          "كل مزايا الاحترافية",
          "تصميم مخصص لبطاقة الدعوة",
          "مدير حساب مخصص",
          "منسقون متعددون",
          "تقارير حضور تفصيلية",
          "دعم مباشر على مدار الحدث",
        ],
        highlight: false,
        ctaLabel: "احجز VIP",
        ctaHref: "https://wa.me/966500000000?text=%D8%A8%D8%A7%D9%82%D8%A9%20VIP",
      },
    ],
  },
  refund: {
    eyebrow: "REFUND POLICY",
    title: "سياسة الاسترجاع والإلغاء",
    subtitle: "نلتزم بأنظمة التجارة الإلكترونية في المملكة العربية السعودية.",
    body:
      "١. طبيعة الخدمة\nخدمة INVITLY خدمة رقمية تُقدَّم فور تفعيل الاشتراك، وتشمل تصميم بطاقة الدعوة، وإرسال الروابط، وإدارة الردود.\n\n٢. إلغاء الطلب قبل بدء التنفيذ\nيحق للعميل طلب الإلغاء واسترداد المبلغ كاملاً خلال ٢٤ ساعة من الدفع بشرط عدم البدء في تصميم بطاقة الدعوة أو إرسال أي رسالة للضيوف.\n\n٣. بعد بدء التنفيذ\nإذا بدأ فريق العمل في تخصيص التصميم أو تم إرسال أي دعوة لأحد الضيوف، تُحتسب نسبة تنفيذ ٥٠٪ من قيمة الباقة ويُسترد الباقي عند وجود سبب مقبول.\n\n٤. بعد انعقاد المناسبة\nلا يحق الاسترجاع بعد انتهاء تاريخ المناسبة أو بعد استخدام رابط الحضور من قِبل ٢٠٪ أو أكثر من المدعوين.\n\n٥. مدة استرجاع المبلغ\nعند الموافقة على الاسترجاع، يُعاد المبلغ إلى وسيلة الدفع الأصلية خلال ٧ إلى ١٤ يوم عمل حسب سياسة البنك.\n\n٦. كيفية طلب الاسترجاع\nيرجى التواصل عبر واتساب أو البريد الرسمي مع ذكر رقم الطلب وسبب الطلب.\n\n٧. حالات الاستثناء\nنحتفظ بحق رفض طلبات الاسترجاع في حال ثبوت سوء الاستخدام أو محاولة الاحتيال.\n\nهذه السياسة تتوافق مع نظام التجارة الإلكترونية السعودي ولائحته التنفيذية.",
  },
};

export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return DEFAULT_CONTENT;
  const supa = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supa
    .from("site_content")
    .select("sections, theme, branding, updated_at")
    .eq("id", "home")
    .maybeSingle();
  if (error || !data) return DEFAULT_CONTENT;
  return {
    sections: (data.sections as unknown as SiteSection[]) ?? DEFAULT_CONTENT.sections,
    theme: { ...DEFAULT_CONTENT.theme, ...(data.theme as unknown as Partial<SiteTheme>) },
    branding: {
      ...DEFAULT_CONTENT.branding,
      ...(data.branding as unknown as Partial<SiteBranding>),
    },
    social: {
      ...DEFAULT_CONTENT.social,
      ...((data.branding as unknown as { social?: Partial<SiteSocial> })?.social ?? {}),
    },
    pages: mergePages(
      (data.branding as unknown as { pages?: Partial<SitePages> })?.pages,
    ),
    whatsapp: {
      ...DEFAULT_CONTENT.whatsapp,
      ...((data.branding as unknown as { whatsapp?: Partial<SiteWhatsApp> })?.whatsapp ?? {}),
    },
    commercial: {
      ...DEFAULT_CONTENT.commercial,
      ...((data.branding as unknown as { commercial?: Partial<SiteCommercial> })?.commercial ?? {}),
    },
    pricing: {
      ...DEFAULT_CONTENT.pricing,
      ...((data.branding as unknown as { pricing?: Partial<SitePricing> })?.pricing ?? {}),
    },
    refund: {
      ...DEFAULT_CONTENT.refund,
      ...((data.branding as unknown as { refund?: Partial<SiteRefund> })?.refund ?? {}),
    },
    updated_at: data.updated_at,
  } as SiteContent;
});

function mergePages(input: Partial<SitePages> | undefined): SitePages {
  const src = input ?? {};
  const out = { ...DEFAULT_CONTENT.pages };
  (Object.keys(out) as Array<keyof SitePages>).forEach((k) => {
    out[k] = { ...out[k], ...(src[k] ?? {}) };
  });
  return out;
}

export const getMyPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return await checkPermissions(context.userId);
  });

export const updateSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { content: SiteContent }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const perms = await checkPermissions(userId);
    if (!perms.isAdmin && !perms.isEditor && !perms.isSuperAdmin) {
      throw new Error("Forbidden");
    }
    const { error } = await supabase
      .from("site_content")
      .update({
        sections: data.content.sections as never,
        theme: data.content.theme as never,
        branding: {
          ...data.content.branding,
          social: data.content.social,
          pages: data.content.pages,
          whatsapp: data.content.whatsapp,
        } as never,
        updated_by: userId,
      })
      .eq("id", "home");
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!(await checkPermissions(userId)).isSuperAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }));
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r) => {
      const list = roleMap.get(r.user_id) ?? [];
      list.push(r.role);
      roleMap.set(r.user_id, list);
    });
    return users.map((u) => ({ ...u, roles: roleMap.get(u.id) ?? [] }));
  });

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; role: "admin" | "editor" | "user" | "owner" }) => d)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await checkPermissions(userId)).isSuperAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: data.targetUserId, role: data.role as never },
        { onConflict: "user_id,role" },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; role: "admin" | "editor" | "user" | "owner" }) => d)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await checkPermissions(userId)).isSuperAdmin) throw new Error("Forbidden");
    // Do not allow super admin to revoke their own admin role via this endpoint
    if (data.targetUserId === userId && data.role === "admin") {
      throw new Error("Cannot revoke your own admin role");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.targetUserId)
      .eq("role", data.role as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------- Super Admin: user lifecycle ---------- */

async function checkPermissions(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: superFlag }, { data: roleRows }] = await Promise.all([
    supabaseAdmin.rpc(
      "admin_check_super_admin" as never,
      { _user_id: userId } as never,
    ),
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const roles = new Set((roleRows ?? []).map((r) => r.role as string));
  return {
    isSuperAdmin: superFlag === true,
    isAdmin: roles.has("admin"),
    isEditor: roles.has("editor"),
  };
}

async function assertSuperAdmin(ctx: { userId: string }) {
  if (!(await checkPermissions(ctx.userId)).isSuperAdmin) throw new Error("Forbidden");
}

export const createUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string; role: "admin" | "editor" | "coordinator" | "owner" | "user" }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    const uid = created.user?.id;
    if (!uid) throw new Error("Failed to create user");
    if (data.role !== "user") {
      const { error: rErr } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: uid, role: data.role as never }, { onConflict: "user_id,role" });
      if (rErr) throw new Error(rErr.message);
    }
    return { ok: true as const, userId: uid };
  });

export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    if (data.targetUserId === context.userId) throw new Error("Cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.targetUserId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setUserBanned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; banned: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    if (data.targetUserId === context.userId) throw new Error("Cannot change your own account status");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.targetUserId, {
      ban_duration: data.banned ? "876000h" : "none",
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------- Assign event owner ---------- */

export const assignEventOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { event_id: string; owner_user_id: string | null }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("events")
      .update({ owner_user_id: data.owner_user_id } as never)
      .eq("id", data.event_id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });