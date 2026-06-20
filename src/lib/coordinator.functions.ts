import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import bcrypt from "bcryptjs";

const usernameSchema = z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_.-]+$/);

/* ---------- Host-only: manage coordinators ---------- */

export const listCoordinators = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ event_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // RLS scoped by host
    const { data: rows, error } = await context.supabase
      .from("coordinators")
      .select("id,name,username,password_plain,last_login_at,created_at")
      .eq("event_id", data.event_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createCoordinator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      event_id: z.string().uuid(),
      name: z.string().trim().min(2).max(80),
      username: usernameSchema,
      password: z.string().min(6).max(72),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const password_hash = await bcrypt.hash(data.password, 10);
    const { data: row, error } = await context.supabase
      .from("coordinators")
      .insert({
        event_id: data.event_id,
        name: data.name,
        username: data.username.toLowerCase(),
        password_hash,
        password_plain: data.password,
      })
      .select("id,name,username,created_at")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("اسم المستخدم مستخدم بالفعل");
      throw new Error(error.message);
    }
    return row;
  });

export const updateCoordinator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(2).max(80).optional(),
      username: usernameSchema.optional(),
      password: z.string().min(6).max(72).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: { name?: string; username?: string; password_hash?: string; password_plain?: string } = {};
    if (data.name) patch.name = data.name;
    if (data.username) patch.username = data.username.toLowerCase();
    if (data.password) {
      patch.password_hash = await bcrypt.hash(data.password, 10);
      patch.password_plain = data.password;
    }
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await context.supabase.from("coordinators").update(patch).eq("id", data.id);
    if (error) {
      if (error.code === "23505") throw new Error("اسم المستخدم مستخدم بالفعل");
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteCoordinator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("coordinators").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Public: coordinator login + session ---------- */

function newToken() {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, "0")).join("");
}

export const loginCoordinator = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ username: z.string().trim().min(1), password: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("coordinators")
      .select("id,event_id,name,password_hash")
      .eq("username", data.username.toLowerCase())
      .maybeSingle();
    if (!row) throw new Error("بيانات الدخول غير صحيحة");
    const ok = await bcrypt.compare(data.password, row.password_hash);
    if (!ok) throw new Error("بيانات الدخول غير صحيحة");
    const session_token = newToken();
    await supabaseAdmin
      .from("coordinators")
      .update({ session_token, last_login_at: new Date().toISOString() })
      .eq("id", row.id);
    return { coordinator_id: row.id, event_id: row.event_id, name: row.name, session_token };
  });

async function authCoordinator(coordinator_id: string, session_token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("coordinators")
    .select("id,event_id,name,session_token")
    .eq("id", coordinator_id)
    .maybeSingle();
  if (!row || !row.session_token || row.session_token !== session_token) {
    throw new Error("الجلسة منتهية، يرجى تسجيل الدخول مجدداً");
  }
  return { row, supabaseAdmin };
}

const sessionSchema = z.object({
  coordinator_id: z.string().uuid(),
  session_token: z.string().min(8).max(128),
});

export const getCoordinatorContext = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => sessionSchema.parse(d))
  .handler(async ({ data }) => {
    const { row, supabaseAdmin } = await authCoordinator(data.coordinator_id, data.session_token);
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("id,name,event_type,event_date,location")
      .eq("id", row.event_id)
      .single();
    const { data: guests } = await supabaseAdmin
      .from("guests")
      .select("id,name,phone,rsvp_status,companions_count,notes,token,checked_in_at")
      .eq("event_id", row.event_id)
      .order("name", { ascending: true });
    return { coordinator: { id: row.id, name: row.name }, event, guests: guests ?? [] };
  });

export const coordinatorCheckIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    sessionSchema.extend({ guest_token: z.string().min(4).max(128) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { row, supabaseAdmin } = await authCoordinator(data.coordinator_id, data.session_token);
    const { data: guest } = await supabaseAdmin
      .from("guests")
      .select("id,name,companions_count,notes,event_id,rsvp_status,checked_in_at")
      .eq("token", data.guest_token)
      .eq("event_id", row.event_id)
      .maybeSingle();
    if (!guest) throw new Error("المدعو غير موجود في هذه الفعالية");
    if (guest.rsvp_status === "attended") {
      const err = new Error(`هذا الرمز تم استخدامه بالفعل! وقت التسجيل: ${guest.checked_in_at ?? "—"}`);
      (err as Error & { code?: string; guest?: unknown }).code = "ALREADY_CHECKED_IN";
      (err as Error & { code?: string; guest?: unknown }).guest = guest;
      throw err;
    }
    await supabaseAdmin
      .from("guests")
      .update({ rsvp_status: "attended", checked_in_at: new Date().toISOString() })
      .eq("id", guest.id);
    return { ...guest, rsvp_status: "attended" };
  });

export const coordinatorCheckInById = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    sessionSchema.extend({ guest_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { row, supabaseAdmin } = await authCoordinator(data.coordinator_id, data.session_token);
    const { data: guest } = await supabaseAdmin
      .from("guests")
      .select("id,name,companions_count,notes,event_id,rsvp_status,checked_in_at")
      .eq("id", data.guest_id)
      .eq("event_id", row.event_id)
      .maybeSingle();
    if (!guest) throw new Error("المدعو غير موجود");
    if (guest.rsvp_status === "attended") {
      throw new Error(`هذا المدعو مسجّل سابقاً (${guest.checked_in_at ?? "—"})`);
    }
    await supabaseAdmin
      .from("guests")
      .update({ rsvp_status: "attended", checked_in_at: new Date().toISOString() })
      .eq("id", guest.id);
    return { ...guest, rsvp_status: "attended" };
  });

export const coordinatorUpdateGuest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    sessionSchema.extend({
      guest_id: z.string().uuid(),
      rsvp_status: z.enum(["pending", "accepted", "declined", "attended"]).optional(),
      companions_count: z.number().int().min(0).max(10).optional(),
      notes: z.string().max(500).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { row, supabaseAdmin } = await authCoordinator(data.coordinator_id, data.session_token);
    const patch: { rsvp_status?: string; companions_count?: number; notes?: string | null; checked_in_at?: string | null } = {};
    if (data.rsvp_status !== undefined) {
      patch.rsvp_status = data.rsvp_status;
      if (data.rsvp_status === "attended") patch.checked_in_at = new Date().toISOString();
      else patch.checked_in_at = null;
    }
    if (data.companions_count !== undefined) patch.companions_count = data.companions_count;
    if (data.notes !== undefined) patch.notes = data.notes;
    const { data: updated, error } = await supabaseAdmin
      .from("guests")
      .update(patch)
      .eq("id", data.guest_id)
      .eq("event_id", row.event_id)
      .select("id,name,phone,rsvp_status,companions_count,notes,token,checked_in_at")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("المدعو غير موجود");
    return updated;
  });