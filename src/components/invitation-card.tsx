import { formatArabicDate } from "@/lib/event-utils";

export type TemplateConfig = {
  template?: string;
  bg_color?: string;
  text_color?: string;
  accent_color?: string;
  font?: string;
  custom_title?: string;
  custom_message?: string;
  image_url?: string;
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
  const font = config.font === "tajawal" ? "'Tajawal', sans-serif" : "'Amiri', serif";
  return (
    <div
      className="relative overflow-hidden rounded-3xl border shadow-2xl"
      style={{ background: bg, color: text, fontFamily: font, borderColor: accent + "55" }}
    >
      {config.image_url ? (
        <div className="h-48 w-full overflow-hidden">
          <img src={config.image_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="px-8 py-12 text-center">
        <div className="mx-auto mb-6 h-px w-20" style={{ background: accent }} />
        <p className="text-sm tracking-widest uppercase" style={{ color: accent }}>
          دعوة كريمة
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
          {config.custom_title || eventName}
        </h1>
        {guestName ? (
          <p className="mt-6 text-lg">
            يسرّنا دعوتك يا <span className="font-bold" style={{ color: accent }}>{guestName}</span>
          </p>
        ) : null}
        {config.custom_message ? (
          <p className="mx-auto mt-4 max-w-md text-base leading-loose opacity-90">
            {config.custom_message}
          </p>
        ) : null}
        <div className="mx-auto mt-8 h-px w-20" style={{ background: accent }} />
        <p className="mt-6 text-lg font-medium">{formatArabicDate(eventDate)}</p>
        {location ? <p className="mt-2 text-sm opacity-80">{location}</p> : null}
      </div>
    </div>
  );
}