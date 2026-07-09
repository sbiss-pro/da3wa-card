import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoami from "./tools/whoami";
import listMyEvents from "./tools/list-my-events";
import getEvent from "./tools/get-event";
import listEventGuests from "./tools/list-event-guests";
import getEventStats from "./tools/get-event-stats";

// The OAuth issuer must be the direct Supabase host, not the Lovable Cloud proxy.
// VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time. The sentinel keeps
// the issuer well-formed if the literal is unset during manifest extraction.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "invitly-mcp",
  title: "INVITLY",
  version: "0.1.0",
  instructions:
    "أدوات INVITLY لإدارة الدعوات والضيوف. يوفّر: عرض فعالياتك، تفاصيل فعالية، قائمة الضيوف، وإحصائيات RSVP والحضور. جميع الأدوات تعمل نيابةً عن المستخدم المسجّل وتحترم صلاحياته (مضيف/مالك).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoami, listMyEvents, getEvent, listEventGuests, getEventStats],
});
