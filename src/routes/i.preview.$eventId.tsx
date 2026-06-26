import { createFileRoute, notFound } from "@tanstack/react-router";
import { GuestInvitationView, type GuestData, type EventData } from "@/components/guest-invitation-view";
import { getEventForPreview } from "@/lib/invitation.functions";

export const Route = createFileRoute("/i/preview/$eventId")({
  ssr: false,
  head: () => ({ meta: [{ title: "معاينة البطاقة — دعوتي" }] }),
  loader: async ({ params }) => {
    try {
      const event = await getEventForPreview({ data: { event_id: params.eventId } });
      return event as EventData;
    } catch {
      throw notFound();
    }
  },
  component: PreviewPage,
});

function PreviewPage() {
  const event = Route.useLoaderData() as EventData;
  const tc = event.template_config || {};
  // Synthetic guest — never reflects any real invitee.
  const dummyGuest: GuestData = {
    id: "preview-guest",
    token: "preview",
    name: "ضيف الشرف",
    title: "الأستاذ",
    rsvp_status: "pending",
    companions_count: Math.max(0, Math.min(10, tc.max_companions ?? 2)),
    companion_names: [],
    notes: null,
  };
  return <GuestInvitationView event={event} initialGuest={dummyGuest} preview />;
}