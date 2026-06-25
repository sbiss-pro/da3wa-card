export const EVENT_TYPES = [
  { value: "wedding", label: "زفاف" },
  { value: "engagement", label: "خطوبة" },
  { value: "birthday", label: "عيد ميلاد" },
  { value: "corporate", label: "فعالية مؤسسية" },
  { value: "meeting", label: "اجتماع" },
  { value: "other", label: "أخرى" },
] as const;

export const eventTypeLabel = (v: string) =>
  EVENT_TYPES.find((t) => t.value === v)?.label ?? v;

export const RSVP_LABELS: Record<string, string> = {
  pending: "لم يرد",
  accepted: "مقبول",
  declined: "اعتذر",
  attended: "حضر",
};

export const RSVP_COLORS: Record<string, string> = {
  pending: "oklch(0.7 0.02 80)",
  accepted: "oklch(0.65 0.13 145)",
  declined: "oklch(0.6 0.2 25)",
  attended: "oklch(0.72 0.13 78)",
};

export function formatArabicDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

/** Convert Western digits in a string to Eastern Arabic digits (٠–٩). */
export function toArabicDigits(input: string | number): string {
  const map = "٠١٢٣٤٥٦٧٨٩";
  return String(input).replace(/\d/g, (d) => map[Number(d)]);
}

/**
 * Normalize Eastern Arabic-Indic digits (٠–٩ Arabic and ۰–۹ Persian) into
 * standard Western Arabic numerals (0–9). Used at every import boundary
 * (CSV/Excel + manual entry) to prevent database/regex parsing errors.
 */
export function easternToWestern(input: string | number | null | undefined): string {
  if (input == null) return "";
  return String(input)
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

/**
 * Format an "HH:MM" 24h string as 12-hour Eastern Arabic numerals with ص/م,
 * e.g. "21:00" -> "٠٩:٠٠ م".
 */
export function formatArabicTime12(hhmm: string): string {
  if (!hhmm) return "";
  const [hStr, mStr = "00"] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const period = h >= 12 ? "م" : "ص";
  h = h % 12;
  if (h === 0) h = 12;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${toArabicDigits(hh)}:${toArabicDigits(mm)} ${period}`;
}

export function buildCalendarLinks(opts: {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  durationHours?: number;
}) {
  const end = new Date(opts.start.getTime() + (opts.durationHours ?? 3) * 3600 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  // RFC 5545 escaping: backslash, semicolon, comma, and CR/LF must be escaped.
  const ics_esc = (s: string) =>
    (s || "")
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\r|\n/g, "\\n")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title.replace(/[\r\n]+/g, " "),
    dates: `${fmt(opts.start)}/${fmt(end)}`,
    details: (opts.description ?? "").replace(/[\r\n]+/g, " "),
    location: (opts.location ?? "").replace(/[\r\n]+/g, " "),
  });
  const google = `https://calendar.google.com/calendar/render?${params.toString()}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dawati//Invitations//AR",
    "BEGIN:VEVENT",
    `SUMMARY:${ics_esc(opts.title)}`,
    `DTSTART:${fmt(opts.start)}`,
    `DTEND:${fmt(end)}`,
    `LOCATION:${ics_esc(opts.location ?? "")}`,
    `DESCRIPTION:${ics_esc(opts.description ?? "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return {
    google,
    apple: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`,
  };
}

/** Allow only http(s) URLs; returns null for anything else (javascript:, data:, vbscript:…). */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}