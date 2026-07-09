import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_event_guests",
  title: "قائمة الضيوف",
  description:
    "List guests for an INVITLY event hosted by the signed-in user. Returns name, phone, rsvp_status, companions_count, attended_count, checked_in_at.",
  inputSchema: {
    event_id: z.string().uuid().describe("The event UUID."),
    limit: z.number().int().min(1).max(500).optional().describe("Max rows to return (default 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ event_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("guests")
      .select("id, name, phone, rsvp_status, companions_count, attended_count, checked_in_at")
      .eq("event_id", event_id)
      .order("created_at", { ascending: true })
      .limit(limit ?? 100);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { guests: data ?? [] },
    };
  },
});
