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
    if (error) {
      console.error("[listCoordinators]", error);
      throw new Error("حدث خطأ، يرجى المحاولة لاحقاً");
    }
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
      console.error("[createCoordinator]", error);
      throw new Error("حدث خطأ، يرجى المحاولة لاحقاً");
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
    const patch: { name?: string; username?: string; password_hash?: string } = {};
    if (data.name) patch.name = data.name;
    if (data.username) patch.username = data.username.toLowerCase();
    if (data.password) {
      patch.password_hash = await bcrypt.hash(data.password, 10);
    }
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await context.supabase.from("coordinators").update(patch).eq("id", data.id);
    if (error) {
      if (error.code === "23505") throw new Error("اسم المستخدم مستخدم بالفعل");
      console.error("[updateCoordinator]", error);
      throw new Error("حدث خطأ، يرجى المحاولة لاحقاً");
    }
    return { ok: true };
  });

export const deleteCoordinator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("coordinators").delete().eq("id", data.id);
    if (error) {
      console.error("[deleteCoordinator]", error);
      throw new Error("حدث خطأ، يرجى المحاولة لاحقاً");
    }
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
    const session_expires_at = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from("coordinators")
      .update({ session_token, session_expires_at, last_login_at: new Date().toISOString() })
      .eq("id", row.id);
    return { coordinator_id: row.id, event_id: row.event_id, name: row.name, session_token };
  });

async function authCoordinator(coordinator_id: string, session_token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("coordinators")
    .select("id,event_id,name,session_token,session_expires_at")
    .eq("id", coordinator_id)
    .maybeSingle();
  if (!row || !row.session_token || row.session_token !== session_token) {
    throw new Error("الجلسة منتهية، يرجى تسجيل الدخول مجدداً");
  }
  if (!row.session_expires_at || new Date(row.session_expires_at).getTime() < Date.now()) {
    // Invalidate stale token defensively.
    await supabaseAdmin.from("coordinators").update({ session_token: null, session_expires_at: null }).eq("id", row.id);
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
      .select("id,name,title,phone,rsvp_status,companions_count,companion_names,attended_count,notes,notes_seen_at,token,checked_in_at")
      .eq("event_id", row.event_id)
      .order("name", { ascending: true });
    // Strict RBAC: hide notes from declined guests (wishes wall is host-only).
    const sanitized = (guests ?? []).map((g) => {
      if (g.rsvp_status === "declined") return { ...g, notes: null, notes_seen_at: null };
      return g;
    });
    return { coordinator: { id: row.id, name: row.name }, event, guests: sanitized };
  });

async function logScan(opts: {
  event_id: string;
  coordinator_id: string;
  coordinator_name: string;
  guest_id: string;
  guest_name: string;
  attended_count?: number;
  partial?: boolean;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("scan_logs").insert({
    event_id: opts.event_id,
    coordinator_id: opts.coordinator_id,
    coordinator_name: opts.coordinator_name,
    guest_id: opts.guest_id,
    guest_name: opts.guest_name,
    attended_count: opts.attended_count ?? null,
    partial: opts.partial ?? false,
  });
}

/**
 * Smart admission state machine — supports partial check-ins and late-arriving
 * companions. The guest's QR code stays valid until the group is fully admitted
 * (attended_count === companions_count + 1).
 *
 * First scan: the main guest is admitted automatically, plus `companions_now`
 *   additional companions (0..max_companions).
 * Later scans: only companions are admitted (main is already in). The counter
 *   is capped at remaining seats; once the last seat is filled, the code is
 *   locked and further scans surface ALREADY_CHECKED_IN.
 */
function buildAdmissionPatch(guest: { rsvp_status: string; companions_count: number | null; attended_count: number | null; checked_in_at: string | null }, companions_now: number) {
  if (guest.rsvp_status === "declined") {
    throw new Error("لا يمكن تسجيل حضور مدعو معتذِر — يرجى مراجعة المضيف");
  }
  const groupSize = (guest.companions_count ?? 0) + 1;
  const current = guest.attended_count ?? 0;
  if (current >= groupSize) {
    const err = new Error(`تنبيه: هذا الرمز مستخدم بالكامل! وقت أول تسجيل: ${guest.checked_in_at ?? "—"}`);
    (err as Error & { code?: string }).code = "ALREADY_CHECKED_IN";
    throw err;
  }
  const remaining = groupSize - current;
  const firstScan = current === 0;
  const requestedCompanions = Math.max(0, Math.floor(companions_now));
  const maxCompanionsThisScan = firstScan ? Math.min(groupSize - 1, remaining - 1) : remaining;
  const companionsAdmitted = Math.min(requestedCompanions, Math.max(0, maxCompanionsThisScan));
  const admit = (firstScan ? 1 : 0) + companionsAdmitted;
  if (admit <= 0) {
    throw new Error("لا توجد مقاعد متبقية لإضافتها");
  }
  const total = current + admit;
  const partial = total < groupSize;
  return {
    patch: {
      rsvp_status: "attended",
      checked_in_at: firstScan ? new Date().toISOString() : guest.checked_in_at,
      attended_count: total,
    } as const,
    total,
    groupSize,
    partial,
    admit,
    companionsAdmitted,
    firstScan,
  };
}

const guestSelect = "id,name,title,phone,companions_count,companion_names,notes,event_id,rsvp_status,checked_in_at,attended_count,token";

export const coordinatorCheckIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    sessionSchema.extend({
      guest_token: z.string().min(4).max(128),
      companions_now: z.number().int().min(0).max(11).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { row, supabaseAdmin } = await authCoordinator(data.coordinator_id, data.session_token);
    const { data: guest } = await supabaseAdmin
      .from("guests").select(guestSelect)
      .eq("token", data.guest_token).eq("event_id", row.event_id).maybeSingle();
    if (!guest) throw new Error("الرمز غير معروف في هذه الفعالية");
    const { patch, total, groupSize, partial, admit, companionsAdmitted, firstScan } =
      buildAdmissionPatch(guest, data.companions_now ?? (groupSize_default(guest) - 1));
    await supabaseAdmin.from("guests").update(patch).eq("id", guest.id);
    await logScan({ event_id: row.event_id, coordinator_id: row.id, coordinator_name: row.name, guest_id: guest.id, guest_name: guest.name, attended_count: total, partial });
    return { ...guest, ...patch, group_size: groupSize, remaining: groupSize - total, partial, admit, companions_admitted: companionsAdmitted, first_scan: firstScan };
  });

function groupSize_default(g: { companions_count: number | null }) {
  return (g.companions_count ?? 0) + 1;
}

export const coordinatorCheckInById = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    sessionSchema.extend({
      guest_id: z.string().uuid(),
      companions_now: z.number().int().min(0).max(11).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { row, supabaseAdmin } = await authCoordinator(data.coordinator_id, data.session_token);
    const { data: guest } = await supabaseAdmin
      .from("guests").select(guestSelect)
      .eq("id", data.guest_id).eq("event_id", row.event_id).maybeSingle();
    if (!guest) throw new Error("المدعو غير موجود");
    const { patch, total, groupSize, partial, admit, companionsAdmitted, firstScan } =
      buildAdmissionPatch(guest, data.companions_now ?? (groupSize_default(guest) - 1));
    await supabaseAdmin.from("guests").update(patch).eq("id", guest.id);
    await logScan({ event_id: row.event_id, coordinator_id: row.id, coordinator_name: row.name, guest_id: guest.id, guest_name: guest.name, attended_count: total, partial });
    return { ...guest, ...patch, group_size: groupSize, remaining: groupSize - total, partial, admit, companions_admitted: companionsAdmitted, first_scan: firstScan };
  });

/**
 * Strict-RBAC coordinator action: toggle whether the guest's note has been
 * reviewed by the team. The master note text is never altered.
 */
export const coordinatorMarkNoteSeen = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    sessionSchema.extend({
      guest_id: z.string().uuid(),
      seen: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { row, supabaseAdmin } = await authCoordinator(data.coordinator_id, data.session_token);
    const { data: updated, error } = await supabaseAdmin
      .from("guests")
      .update({ notes_seen_at: data.seen ? new Date().toISOString() : null })
      .eq("id", data.guest_id)
      .eq("event_id", row.event_id)
      .select("id,name,title,phone,rsvp_status,companions_count,notes,notes_seen_at,token,checked_in_at")
      .maybeSingle();
    if (error) {
      console.error("[coordinatorMarkNoteSeen]", error);
      throw new Error("حدث خطأ، يرجى المحاولة لاحقاً");
    }
    if (!updated) throw new Error("المدعو غير موجود");
    return updated;
  });