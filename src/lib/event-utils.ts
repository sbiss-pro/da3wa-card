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
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(opts.start)}/${fmt(end)}`,
    details: opts.description ?? "",
    location: opts.location ?? "",
  });
  const google = `https://calendar.google.com/calendar/render?${params.toString()}`;
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${opts.title}\nDTSTART:${fmt(opts.start)}\nDTEND:${fmt(end)}\nLOCATION:${opts.location ?? ""}\nDESCRIPTION:${opts.description ?? ""}\nEND:VEVENT\nEND:VCALENDAR`;
  return {
    google,
    apple: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`,
  };
}