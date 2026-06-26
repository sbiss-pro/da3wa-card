import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tokenSchema = z.object({ token: z.string().min(8).max(64) });
const eventIdSchema = z.object({ event_id: z.string().uuid() });

export const getInvitation = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: guest, error: gErr } = await supabaseAdmin
      .from("guests")
      .select("id,token,name,title,rsvp_status,companions_count,companion_names,notes,event_id")
      .eq("token", data.token)
      .maybeSingle();
    if (gErr) {
      console.error("[getInvitation] guest lookup failed", gErr);
      throw new Error("الخدمة غير متاحة مؤقتاً");
    }
    if (!guest) throw new Error("NOT_FOUND");
    const { data: event, error: eErr } = await supabaseAdmin
      .from("events")
      .select("id,name,event_type,event_date,location,location_url,description,template_config")
      .eq("id", guest.event_id)
      .single();
    if (eErr || !event) {
      if (eErr) console.error("[getInvitation] event lookup failed", eErr);
      throw new Error("NOT_FOUND");
    }
    return { guest, event };
  });

/**
 * Public preview endpoint: returns the event so the organizer can preview the
 * guest invitation page with dummy data. Does NOT touch the guests table.
 */
export const getEventForPreview = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => eventIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: event, error } = await supabaseAdmin
      .from("events")
      .select("id,name,event_type,event_date,location,location_url,description,template_config")
      .eq("id", data.event_id)
      .single();
    if (error || !event) throw new Error("NOT_FOUND");
    return event;
  });

const rsvpSchema = z.object({
  token: z.string().min(8).max(64),
  status: z.enum(["accepted", "declined"]),
  notes: z.string().max(500).optional().nullable(),
  companions_count: z.number().int().min(0).max(10).optional(),
  companion_names: z.array(z.string().trim().max(80)).max(10).optional(),
});

export const submitRsvp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => rsvpSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Look up guest + event to enforce RSVP deadline server-side. Companion
    // count is host-controlled — guests have ZERO input over it.
    const { data: existing } = await supabaseAdmin
      .from("guests")
      .select("id,event_id,companions_count,original_rsvp_status")
      .eq("token", data.token)
      .maybeSingle();
    if (!existing) throw new Error("NOT_FOUND");
    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("template_config")
      .eq("id", existing.event_id)
      .maybeSingle();
    const tc = (ev?.template_config ?? {}) as { rsvp_deadline?: string | null; event_end_date?: string | null; max_companions?: number };
    const deadline = tc.rsvp_deadline || tc.event_end_date;
    if (deadline && new Date(deadline).getTime() < Date.now()) {
      throw new Error("انتهت الفترة المحددة لتأكيد الحضور");
    }
    const maxC = Math.max(0, Math.min(10, tc.max_companions ?? 0));
    let comps = data.companions_count ?? 0;
    if (comps > maxC) comps = maxC;
    if (comps < 0) comps = 0;
    const names = (data.companion_names ?? []).slice(0, comps).map((s) => s.trim()).filter(Boolean);
    const patch: {
      rsvp_status: string;
      notes: string | null;
      companions_count?: number;
      companion_names?: string[];
      original_rsvp_status?: string;
      original_companions_count?: number;
      status_overridden_by_host?: boolean;
    } = {
      rsvp_status: data.status,
      notes: data.notes ? data.notes : null,
      status_overridden_by_host: false,
    };
    if (data.status === "accepted") {
      patch.companions_count = comps;
      patch.companion_names = names;
    } else {
      patch.companions_count = 0;
      patch.companion_names = [];
    }
    if (!existing.original_rsvp_status) {
      patch.original_rsvp_status = data.status;
      patch.original_companions_count = existing.companions_count ?? 0;
    }
    const { data: updated, error } = await supabaseAdmin
      .from("guests")
      .update(patch)
      .eq("token", data.token)
      .select("id,token,name,title,rsvp_status,companions_count,companion_names,notes,event_id")
      .maybeSingle();
    if (error) {
      console.error("[submitRsvp] update failed", error);
      throw new Error("تعذّر تسجيل ردك، يرجى المحاولة لاحقاً");
    }
    if (!updated) throw new Error("NOT_FOUND");
    return updated;
  });