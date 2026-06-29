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
  use_blurred_bg?: boolean;
  rsvp_question?: string;
  invitation_pill?: string;
  typography?: {
    font_family?: string;
    title?: TypographySlot;
    date?: TypographySlot;
    location?: TypographySlot;
    description?: TypographySlot;
    footer?: TypographySlot;
  };
  colors?: {
    page_bg?: string;
    text?: string;
    icon?: string;
    accent?: string;
  };
  visibility?: {
    event_name?: boolean;
    start_time?: boolean;
    end_time?: boolean;
    countdown?: boolean;
    location?: boolean;
    description?: boolean;
    qr?: boolean;
    calendar?: boolean;
    rsvp_question?: boolean;
  };
};

export type TypographySlot = {
  font?: string;
  size?: number;
  color?: string;
};

export const ARABIC_FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "Tajawal", label: "Tajawal — تجوال" },
  { value: "Amiri", label: "Amiri — أميري" },
  { value: "Cairo", label: "Cairo — القاهرة" },
  { value: "Reem Kufi", label: "Reem Kufi — ريم كوفي" },
  { value: "Almarai", label: "Almarai — المراعي" },
  { value: "Noto Naskh Arabic", label: "Noto Naskh — نسخ" },
];

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
  const raw = config.invitation_image_url;
  if (!raw) {
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
  const src = /^https?:\/\//i.test(raw) ? `/api/public/proxy?url=${encodeURIComponent(raw)}` : raw;
  const isPdf = /\.pdf(\?|#|$)/i.test(raw);
  return (
    <div
      className="overflow-hidden rounded-3xl border shadow-2xl"
      style={{ borderColor: accent + "55" }}
    >
      {isPdf ? (
        <iframe src={src} title={eventName} className="block h-[70vh] w-full" style={{ background: "#fff" }} />
      ) : (
        <img src={src} alt={eventName} className="block h-auto w-full" />
      )}
    </div>
  );
}