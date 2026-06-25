import { formatArabicDate, formatArabicTime12 } from "@/lib/event-utils";

export type TimelineItem = { time: string; title: string };

export type TemplateConfig = {
  template?: string;
  bg_color?: string;
  text_color?: string;
  accent_color?: string;
  font?: string;
  custom_title?: string;
  custom_message?: string;
  image_url?: string;
  timeline?: TimelineItem[];
  rsvp_deadline?: string | null;
  wa_message_template?: string;
  bg_blur?: boolean;
  text_align?: "right" | "center" | "left";
  text_size?: "sm" | "md" | "lg" | "xl";
  // Per-element typographic control (responsive base, scales down on mobile via CSS clamp)
  title_size?: number; // base px
  title_align?: "right" | "center" | "left";
  guest_name_size?: number;
  message_size?: number;
  message_align?: "right" | "center" | "left";
  date_size?: number;
  // Audio background
  audio?: {
    mode: "youtube" | "url" | "file";
    src: string;
  } | null;
};

const FONT_MAP: Record<string, string> = {
  amiri: "'Amiri', serif",
  tajawal: "'Tajawal', sans-serif",
  cairo: "'Cairo', sans-serif",
  "reem-kufi": "'Reem Kufi', sans-serif",
};

export function InvitationCard({
  config,
  eventName,
  eventDate,
  location,
  guestName,
}: {
  config: TemplateConfig;
  eventName: string;
  eventDate: string;
  location?: string | null;
  guestName?: string;
}) {
  const bg = config.bg_color || "#f7f1e6";
  const text = config.text_color || "#1a1410";
  const accent = config.accent_color || "#c9a24a";
  const font = FONT_MAP[config.font || "amiri"] || FONT_MAP.amiri;
  const align = config.text_align || "center";
  const sizeClass = config.text_size === "sm" ? "text-sm" : config.text_size === "lg" ? "text-lg" : config.text_size === "xl" ? "text-xl" : "text-base";
  const blurredBg = config.image_url && config.bg_blur;
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border shadow-2xl text-${align}`}
      style={{ background: bg, color: text, fontFamily: font, borderColor: accent + "55" }}
    >
      {blurredBg ? (
        <>
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `url(${config.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }}
            aria-hidden
          />
          <div className="absolute inset-0 backdrop-blur-md bg-black/30" aria-hidden />
        </>
      ) : config.image_url ? (
        <div className="h-48 w-full overflow-hidden">
          <img src={config.image_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className={`relative px-6 py-12 sm:px-8 ${sizeClass}`} style={{ textAlign: align, color: blurredBg ? "#fff" : text }}>
        <div className="mx-auto mb-6 h-px w-20" style={{ background: accent }} />
        <p className="text-sm tracking-widest uppercase" style={{ color: accent }}>
          دعوة كريمة
        </p>
        <h1
          className="mt-3 font-bold leading-tight"
          style={{
            textAlign: config.title_align || align,
            fontSize: config.title_size
              ? `clamp(1.6rem, ${config.title_size / 16}rem, ${config.title_size / 16 + 0.6}rem)`
              : "clamp(1.8rem, 6vw, 3rem)",
          }}
        >
          {config.custom_title || eventName}
        </h1>
        {guestName ? (
          <p
            className="mt-6"
            style={{
              fontSize: config.guest_name_size
                ? `clamp(0.95rem, ${config.guest_name_size / 16}rem, ${config.guest_name_size / 16 + 0.25}rem)`
                : "clamp(1rem, 3.6vw, 1.2rem)",
            }}
          >
            يسرّنا دعوتك يا <span className="font-bold" style={{ color: accent }}>{guestName}</span>
          </p>
        ) : null}
        {config.custom_message ? (
          <p
            className="mx-auto mt-4 max-w-md leading-loose opacity-90 whitespace-pre-wrap"
            style={{
              textAlign: config.message_align || align,
              fontSize: config.message_size
                ? `clamp(0.85rem, ${config.message_size / 16}rem, ${config.message_size / 16 + 0.2}rem)`
                : "clamp(0.95rem, 3.4vw, 1.05rem)",
            }}
          >
            {config.custom_message}
          </p>
        ) : null}
        <div className="mx-auto mt-8 h-px w-20" style={{ background: accent }} />
        <p
          className="mt-6 font-medium"
          style={{
            fontSize: config.date_size
              ? `clamp(0.95rem, ${config.date_size / 16}rem, ${config.date_size / 16 + 0.2}rem)`
              : "clamp(1rem, 3.6vw, 1.2rem)",
          }}
        >
          {formatArabicDate(eventDate)}
        </p>
        {location ? <p className="mt-2 text-sm opacity-80">{location}</p> : null}
        {config.timeline && config.timeline.length > 0 ? (
          <div className="mx-auto mt-8 max-w-md">
            <div className="mx-auto mb-4 h-px w-16" style={{ background: accent }} />
            <p className="mb-3 text-sm tracking-widest" style={{ color: accent }}>
              الجدول الزمني
            </p>
            <ul className="space-y-2 text-right">
              {config.timeline.map((it, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                  style={{ background: accent + "12", border: `1px solid ${accent}33` }}
                >
                  <span className="font-medium">{it.title}</span>
                  <span className="font-bold tabular-nums" style={{ color: accent }}>{formatArabicTime12(it.time)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}