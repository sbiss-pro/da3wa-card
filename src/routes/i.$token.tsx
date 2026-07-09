import { createFileRoute, notFound } from "@tanstack/react-router";
import { GuestInvitationView, type GuestData, type EventData } from "@/components/guest-invitation-view";
import { getInvitation } from "@/lib/invitation.functions";

type LoaderData = { guest: GuestData; event: EventData };

export const Route = createFileRoute("/i/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "دعوتك — INVITLY" },
      { name: "description", content: "صفحة دعوتك الشخصية على منصة INVITLY — أكّد حضورك، شاهد تفاصيل المناسبة، واحصل على رمز QR الخاص بك." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "دعوتك — INVITLY" },
      { property: "og:description", content: "دعوة إلكترونية خاصة عبر منصة INVITLY لتأكيد الحضور والاطلاع على تفاصيل المناسبة." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: GuestPage,
  loader: async ({ params }) => {
    try {
      const result = await getInvitation({ data: { token: params.token } });
      return result as LoaderData;
    } catch {
      throw notFound();
    }
  },
});

function GuestPage() {
  const { guest, event } = Route.useLoaderData() as LoaderData;
  return <GuestInvitationView event={event} initialGuest={guest} />;
}