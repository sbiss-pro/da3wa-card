import { useEffect, useState } from "react";
import {
  MessageCircle,
  Phone,
  Video,
  ArrowLeft,
  Check,
  CheckCircle2,
  XCircle,
  MapPin,
  ImageIcon,
  MoreVertical,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

/**
 * Homepage WhatsApp simulator — renders a single message card that mirrors
 * what a guest actually receives on WhatsApp: image preview + full text body
 * + interactive action buttons (RSVP / location / open card).
 * No fake chat conversation, no composer bar.
 */
export function WhatsAppSimulator({
  senderName = "INVITLY",
  imageUrl = "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  initialMessage = "السلام عليكم أستاذ محمد،\nيسعدنا دعوتكم لحضور مناسبتنا.\nرابط دعوتكم: https://invitly.app/i/demo",
  eventDetails = {
    day: "يوم الجمعة",
    date: "١٥ / ٠٨ / ٢٠٢٦",
    time: "٩:٠٠ مساءً",
    location: "قاعة الأمير سلطان — الرياض",
    locationUrl: "https://maps.google.com/?q=Riyadh",
  },
}: {
  senderName?: string;
  imageUrl?: string;
  initialMessage?: string;
  eventDetails?: {
    day: string;
    date: string;
    time: string;
    location: string;
    locationUrl: string;
  };
}) {
  const [time, setTime] = useState("");
  const [rsvp, setRsvp] = useState<"accepted" | "declined" | null>(null);

  useEffect(() => {
    const d = new Date();
    setTime(
      `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`,
    );
  }, []);

  const reset = () => setRsvp(null);

  // Extract the first URL from the message so we can render the link
  // subtly (as a small "open invitation" chip) instead of blue-underlined
  // raw text inside the body.
  const urlMatch = initialMessage.match(/https?:\/\/\S+/);
  const inviteUrl = urlMatch?.[0] ?? "";
  const bodyText = urlMatch
    ? initialMessage.replace(urlMatch[0], "").replace(/\n{3,}/g, "\n\n").trim()
    : initialMessage;

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[340px]">
      <div className="relative rounded-[2.4rem] border border-border bg-neutral-900 p-2 shadow-2xl">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-neutral-900" />
        {/* Phone screen — fixed height like a real WhatsApp thread */}
        <div className="flex h-[620px] flex-col overflow-hidden rounded-[2rem] bg-[#0b141a] text-white">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-2 bg-[#005c4b] px-3 pb-2 pt-7">
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 opacity-80" />
              <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-[13px] font-semibold">{senderName}</p>
                <p className="text-[10px] opacity-80">متصل الآن</p>
              </div>
            </div>
            <div className="flex items-center gap-3 opacity-80">
              <Video className="h-4 w-4" />
              <Phone className="h-4 w-4" />
              <MoreVertical className="h-4 w-4" />
            </div>
          </div>

          {/* Chat area */}
          <div
            className="flex-1 space-y-2 overflow-y-auto p-3"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "12px 12px",
              backgroundColor: "#0b141a",
            }}
          >
            <div className="mx-auto w-fit rounded-md bg-[#182229] px-2 py-1 text-center text-[10px] text-white/70">
              اليوم
            </div>

            {/* The single invitation message — as the guest sees it */}
            <div className="flex justify-end">
              <div className="relative max-w-[92%] overflow-hidden rounded-2xl rounded-tr-sm bg-[#005c4b] text-[13px] leading-7 shadow">
                {imageUrl ? (
                  <div className="bg-black/20 p-1">
                    <img
                      src={imageUrl}
                      alt="بطاقة الدعوة"
                      className="h-44 w-full rounded-xl object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="m-1 grid h-32 place-items-center rounded-xl bg-black/30 text-white/50">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <div className="px-3 pt-2">
                  <p className="whitespace-pre-wrap break-words text-right">{bodyText}</p>
                  {inviteUrl ? (
                    <a
                      href={inviteUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[11px] text-white/85 transition hover:bg-white/20"
                    >
                      <ExternalLink className="h-3 w-3" />
                      افتح دعوتك
                    </a>
                  ) : null}
                  <div className="mb-1 mt-1.5 flex items-center justify-end gap-1 text-[10px] text-white/70">
                    <span>{time}</span>
                    <Check className="h-3 w-3" />
                    <Check className="-ms-2 h-3 w-3 text-sky-300" />
                  </div>
                </div>

                {/* Action buttons — exactly the ones the guest interacts with */}
                <div className="divide-y divide-white/10 border-t border-white/10 bg-[#014034]">
                  <button
                    type="button"
                    disabled={!!rsvp}
                    onClick={() => setRsvp("accepted")}
                    className="flex w-full items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium text-sky-300 transition hover:bg-white/5 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {rsvp === "accepted" ? "تم قبول الدعوة" : "قبول الدعوة"}
                  </button>
                  <button
                    type="button"
                    disabled={!!rsvp}
                    onClick={() => setRsvp("declined")}
                    className="flex w-full items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium text-sky-300 transition hover:bg-white/5 disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" />
                    {rsvp === "declined" ? "تم الاعتذار" : "الاعتذار عن الدعوة"}
                  </button>
                  <a
                    href={eventDetails.locationUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex w-full items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium text-sky-300 transition hover:bg-white/5"
                  >
                    <MapPin className="h-4 w-4" />
                    موقع المناسبة
                  </a>
                </div>
              </div>
            </div>

            {rsvp ? (
              <div
                className={`mx-auto mt-1 w-fit rounded-full px-3 py-1 text-[10px] ${
                  rsvp === "accepted"
                    ? "bg-emerald-900/50 text-emerald-200"
                    : "bg-rose-900/40 text-rose-200"
                }`}
              >
                {rsvp === "accepted"
                  ? `تفاصيل المناسبة: ${eventDetails.day} • ${eventDetails.date} • ${eventDetails.time} — ${eventDetails.location}`
                  : "نتفهم اعتذاركم — نلقاكم في مناسبة قادمة 🤍"}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11px] font-medium text-foreground/80 backdrop-blur transition hover:border-primary/50 hover:text-primary"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          إعادة المعاينة
        </button>
        <span className="text-[11px] text-muted-foreground">
          هذه هي الرسالة تماماً كما تصل إلى ضيفك
        </span>
      </div>
    </div>
  );
}