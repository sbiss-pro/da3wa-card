import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OwnerEventStats = {
  event_id: string;
  name: string;
  event_type: string;
  event_date: string;
  location: string | null;
  totals: {
    invitations: number;
    confirmed: number;
    declined: number;
    pending: number;
    checked_in: number;
  };
};

export const getMyOwnedEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: events, error } = await supabase
      .from("events")
      .select("id,name,event_type,event_date,location")
      .eq("owner_user_id", userId)
      .order("event_date", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = events ?? [];
    if (rows.length === 0) return [] as OwnerEventStats[];

    const ids = rows.map((e) => e.id);
    const { data: guests } = await supabase
      .from("guests")
      .select("event_id, rsvp_status, checked_in_at")
      .in("event_id", ids);

    const map = new Map<string, OwnerEventStats["totals"]>();
    for (const id of ids) map.set(id, { invitations: 0, confirmed: 0, declined: 0, pending: 0, checked_in: 0 });
    (guests ?? []).forEach((g: { event_id: string; rsvp_status: string | null; checked_in_at: string | null }) => {
      const t = map.get(g.event_id);
      if (!t) return;
      t.invitations += 1;
      const s = (g.rsvp_status ?? "pending").toLowerCase();
      if (s === "confirmed" || s === "accepted") t.confirmed += 1;
      else if (s === "declined") t.declined += 1;
      else t.pending += 1;
      if (g.checked_in_at) t.checked_in += 1;
    });

    return rows.map((e) => ({
      event_id: e.id,
      name: e.name,
      event_type: e.event_type,
      event_date: e.event_date,
      location: e.location,
      totals: map.get(e.id)!,
    })) as OwnerEventStats[];
  });