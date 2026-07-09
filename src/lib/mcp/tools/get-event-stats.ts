import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "get_event_stats",
  title: "إحصائيات الفعالية",
  description:
    "Get RSVP and attendance summary for an INVITLY event: total guests, accepted, declined, pending, attended headcount, and no-show count.",
  inputSchema: {
    event_id: z.string().uuid().describe("The event UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ event_id }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("guests")
      .select("rsvp_status, companions_count, attended_count, checked_in_at")
      .eq("event_id", event_id);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const stats = {
      total_guests: rows.length,
      accepted: rows.filter((r) => r.rsvp_status === "accepted").length,
      declined: rows.filter((r) => r.rsvp_status === "declined").length,
      pending: rows.filter((r) => r.rsvp_status === "pending").length,
      expected_headcount: rows
        .filter((r) => r.rsvp_status === "accepted")
        .reduce((n, r) => n + 1 + (r.companions_count ?? 0), 0),
      attended_headcount: rows.reduce((n, r) => n + (r.attended_count ?? 0), 0),
      checked_in_guests: rows.filter((r) => r.checked_in_at != null).length,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
      structuredContent: stats,
    };
  },
});
