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
      .select("id,name,username,last_login_at,created_at")
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
      })
      .select("id,name,username,created_at")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("اسم المستخدم مستخدم بالفعل");
      throw new Error(error.message);
    }
    return row;
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
      .select("id,name,companions_count,notes,event_id")
      .eq("token", data.guest_token)
      .eq("event_id", row.event_id)
      .maybeSingle();
    if (!guest) throw new Error("المدعو غير موجود في هذه الفعالية");
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
      .select("id,name,companions_count,notes,event_id")
      .eq("id", data.guest_id)
      .eq("event_id", row.event_id)
      .maybeSingle();
    if (!guest) throw new Error("المدعو غير موجود");
    await supabaseAdmin
      .from("guests")
      .update({ rsvp_status: "attended", checked_in_at: new Date().toISOString() })
      .eq("id", guest.id);
    return { ...guest, rsvp_status: "attended" };
  });