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
  max_companions?: number;
  labels?: {
    eyebrow?: string;
    greeting_prefix?: string;
    date_override?: string;
    location_override?: string;
  };
  positions?: Record<string, { x: number; y: number }>;
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
  const pos = config.positions || {};
  const lbl = config.labels || {};
  const eyebrow = lbl.eyebrow ?? "دعوة كريمة";
  const greetingPrefix = lbl.greeting_prefix ?? "يسرّنا دعوتك يا";
  const dateText = lbl.date_override?.trim() ? lbl.date_override : formatArabicDate(eventDate);
  const locText = lbl.location_override?.trim() ? lbl.location_override : (location || "");
  const hasPositions = pos && Object.keys(pos).length > 0;
  const overlayStyle = (key: string): React.CSSProperties | undefined => {
    const p = pos[key];
    if (!p) return undefined;
    return {
      position: "absolute",
      left: `${p.x}%`,
      top: `${p.y}%`,
      transform: "translate(-50%, -50%)",
      maxWidth: "90%",
    };
  };
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
        hasPositions ? (
          <div className="absolute inset-0">
            <img src={config.image_url} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-48 w-full overflow-hidden">
            <img src={config.image_url} alt="" className="h-full w-full object-cover" />
          </div>
        )
      ) : null}
      <div
        className={`relative px-8 py-12 ${sizeClass}`}
        style={{
          textAlign: align,
          color: blurredBg ? "#fff" : text,
          minHeight: hasPositions ? 540 : undefined,
        }}
      >
        <div className="mx-auto mb-6 h-px w-20" style={{ background: accent }} />
        <p className="text-sm tracking-widest uppercase" style={{ color: accent, ...overlayStyle("eyebrow") }}>
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl" style={overlayStyle("title")}>
          {config.custom_title || eventName}
        </h1>
        {guestName ? (
          <p className="mt-6 text-lg" style={overlayStyle("greeting")}>
            {greetingPrefix} <span className="font-bold" style={{ color: accent }}>{guestName}</span>
          </p>
        ) : null}
        {config.custom_message ? (
          <p className="mx-auto mt-4 max-w-md leading-loose opacity-90 whitespace-pre-wrap" style={overlayStyle("message")}>
            {config.custom_message}
          </p>
        ) : null}
        {!hasPositions ? <div className="mx-auto mt-8 h-px w-20" style={{ background: accent }} /> : null}
        <p className="mt-6 text-lg font-medium" style={overlayStyle("date")}>{dateText}</p>
        {locText ? <p className="mt-2 text-sm opacity-80" style={overlayStyle("location")}>{locText}</p> : null}
        {config.timeline && config.timeline.length > 0 ? (
          <div className="mx-auto mt-8 max-w-md" style={overlayStyle("timeline")}>
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