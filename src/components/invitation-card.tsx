/**
 * Lightweight invitation card: shows the host-uploaded image at its natural
 * aspect ratio with a subtle frame. All typography & decoration lives on the
 * guest page itself — this component is just the image surface.
 */
export type TemplateConfig = {
  invitation_image_url?: string;
  palette?: string[];
  event_end_date?: string | null;
  max_companions?: number;
  rsvp_deadline?: string | null;
  wa_message_template?: string;
};

export function InvitationCard({
  config,
  eventName,
}: {
  config: TemplateConfig;
  eventName: string;
  eventDate?: string;
  location?: string | null;
  guestName?: string;
}) {
  const accent = config.palette?.[0] || "#c9a24a";
  const src = config.invitation_image_url;
  if (!src) {
    return (
      <div
        className="grid aspect-[3/4] w-full place-items-center rounded-3xl border border-dashed text-center text-sm text-muted-foreground"
        style={{ borderColor: accent + "66" }}
      >
        <div>
          <p className="font-display text-lg">{eventName}</p>
          <p className="mt-2 opacity-70">لم يتم رفع رابط صورة الدعوة بعد</p>
        </div>
      </div>
    );
  }
  return (
    <div
      className="overflow-hidden rounded-3xl border shadow-2xl"
      style={{ borderColor: accent + "55" }}
    >
      <img src={src} alt={eventName} className="block h-auto w-full" />
    </div>
  );
}