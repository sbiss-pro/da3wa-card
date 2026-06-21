import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tokenSchema = z.object({ token: z.string().min(8).max(64) });

export const getInvitation = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: guest, error: gErr } = await supabaseAdmin
      .from("guests")
      .select("id,token,name,rsvp_status,companions_count,notes,event_id")
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

const rsvpSchema = z.object({
  token: z.string().min(8).max(64),
  status: z.enum(["accepted", "declined"]),
  companions: z.number().int().min(0).max(2),
  notes: z.string().max(500).optional().nullable(),
});

export const submitRsvp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => rsvpSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Look up guest + event to enforce RSVP deadline server-side.
    const { data: existing } = await supabaseAdmin
      .from("guests")
      .select("id,event_id")
      .eq("token", data.token)
      .maybeSingle();
    if (!existing) throw new Error("NOT_FOUND");
    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("template_config")
      .eq("id", existing.event_id)
      .maybeSingle();
    const deadline = (ev?.template_config as { rsvp_deadline?: string | null } | null)?.rsvp_deadline;
    if (deadline && new Date(deadline).getTime() < Date.now()) {
      throw new Error("انتهت الفترة المحددة لتأكيد الحضور");
    }
    const { data: updated, error } = await supabaseAdmin
      .from("guests")
      .update({
        rsvp_status: data.status,
        companions_count: data.companions,
        notes: data.notes ? data.notes : null,
      })
      .eq("token", data.token)
      .select("id,token,name,rsvp_status,companions_count,notes,event_id")
      .maybeSingle();
    if (error) {
      console.error("[submitRsvp] update failed", error);
      throw new Error("تعذّر تسجيل ردك، يرجى المحاولة لاحقاً");
    }
    if (!updated) throw new Error("NOT_FOUND");
    return updated;
  });