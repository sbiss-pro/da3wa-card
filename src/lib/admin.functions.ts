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

export type SiteContent = {
  sections: SiteSection[];
  theme: SiteTheme;
  branding: SiteBranding;
  social: SiteSocial;
  pages: SitePages;
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
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: authUser }, { data: roleRows }] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(userId),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const roles = new Set((roleRows ?? []).map((r) => r.role as string));
    const email = (authUser?.user?.email ?? "").toLowerCase();
    return {
      isSuperAdmin: email === "saeedbiss@hotmail.com",
      isAdmin: roles.has("admin"),
      isEditor: roles.has("editor"),
    };
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
  const [{ data: authUser }, { data: roleRows }] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(userId),
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const roles = new Set((roleRows ?? []).map((r) => r.role as string));
  const email = (authUser?.user?.email ?? "").toLowerCase();
  return {
    isSuperAdmin: email === "saeedbiss@hotmail.com",
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