import { useEffect, useMemo, useState } from "react";
import { type TemplateConfig } from "@/components/invitation-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, MapPin, Users } from "lucide-react";
import { buildCalendarLinks, toArabicDigits, RSVP_LABELS, RSVP_COLORS, safeHttpUrl } from "@/lib/event-utils";
import { readableTextOn } from "@/lib/palette";
import { toast } from "sonner";
import QRCode from "qrcode";
import { submitRsvp } from "@/lib/invitation.functions";

export type GuestData = {
  id: string;
  token: string;
  name: string;
  title?: string | null;
  rsvp_status: string;
  companions_count: number;
  companion_names?: string[];
  notes: string | null;
};

export type EventData = {
  id: string;
  name: string;
  event_type: string;
  event_date: string;
  location: string | null;
  location_url: string | null;
  description: string | null;
  template_config: TemplateConfig;
};

function formatArabicClock12(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "م" : "ص";
  h = h % 12;
  if (h === 0) h = 12;
  return `${toArabicDigits(String(h).padStart(2, "0"))}:${toArabicDigits(String(m).padStart(2, "0"))} ${period}`;
}

function formatArabicFullDate(d: Date): string {
  return new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function GuestInvitationView({
  event,
  initialGuest,
  preview = false,
}: {
  event: EventData;
  initialGuest: GuestData;
  preview?: boolean;
}) {
  const [guest, setGuest] = useState(initialGuest);
  const [notes, setNotes] = useState(guest.notes || "");
  const [companionNames, setCompanionNames] = useState<string[]>(guest.companion_names ?? []);
  const [wishes, setWishes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [qr, setQr] = useState<string>("");
  const [mode, setMode] = useState<null | "accept" | "decline">(null);
  const now = useNow(1000);

  const tc = event.template_config || {};
  const palette = tc.palette && tc.palette.length >= 4 ? tc.palette : ["#1a1410", "#c9a24a", "#f7f1e6", "#3a2e2a"];
  const [paletteBg, paletteAccent, paletteSurface, paletteSurface2] = palette;
  const bgColor = paletteBg;
  const accent = paletteAccent;
  const surface = paletteSurface;
  const surface2 = paletteSurface2;
  // Always compute text color for max contrast against the background — guarantees readability.
  const textColor = readableTextOn(bgColor);
  // Icon/label color drawn ON TOP of accent-colored chips/buttons — guarantees readability.
  const onAccent = readableTextOn(accent);
  const softText = textColor === "#ffffff" ? "rgba(255,255,255,0.75)" : "rgba(26,20,16,0.7)";
  const cardBg = textColor === "#ffffff" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.6)";
  const cardBorder = accent + "55";
  const vis = {
    event_name: tc.visibility?.event_name ?? true,
    start_time: tc.visibility?.start_time ?? true,
    end_time: tc.visibility?.end_time ?? false,
    countdown: tc.visibility?.countdown ?? true,
    location: tc.visibility?.location ?? true,
    description: tc.visibility?.description ?? true,
    qr: tc.visibility?.qr ?? true,
    calendar: tc.visibility?.calendar ?? true,
  };

  const mapEmbedSrc = useMemo(() => {
    const url = (event.location_url || "").trim();
    const text = (event.location || "").trim();
    const coordRe = /(-?\d{1,3}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/;
    const m = url.match(coordRe) || text.match(coordRe);
    if (m) return `https://maps.google.com/maps?q=${encodeURIComponent(`${m[1]},${m[2]}`)}&z=16&hl=ar&output=embed`;
    if (text) return `https://maps.google.com/maps?q=${encodeURIComponent(text)}&z=15&hl=ar&output=embed`;
    if (url) return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&hl=ar&output=embed`;
    return "";
  }, [event.location, event.location_url]);

  const startMs = useMemo(() => new Date(event.event_date).getTime(), [event.event_date]);
  const endMs = useMemo(() => (tc.event_end_date ? new Date(tc.event_end_date).getTime() : startMs + 4 * 3600 * 1000), [tc.event_end_date, startMs]);
  const phase: "before" | "during" | "after" = now < startMs ? "before" : now < endMs ? "during" : "after";
  const hostCompanions = Math.max(0, Math.min(10, guest.companions_count || 0));
  const [chosenCompanions, setChosenCompanions] = useState<number>(hostCompanions);
  useEffect(() => { setChosenCompanions(hostCompanions); }, [hostCompanions]);

  let cd = { d: 0, h: 0, m: 0, s: 0 };
  if (phase === "before") {
    const diff = Math.max(0, startMs - now);
    cd = {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  }

  useEffect(() => {
    const eligible = (guest.rsvp_status === "accepted" || guest.rsvp_status === "attended") && phase !== "after";
    if (!eligible || preview) { setQr(""); return; }
    QRCode.toDataURL(`${window.location.origin}/i/${guest.token}`, { width: 320, margin: 2, color: { dark: "#1a1410", light: "#f7f1e6" } }).then(setQr);
  }, [guest.rsvp_status, guest.token, phase, preview]);

  useEffect(() => {
    setCompanionNames((prev) => {
      const next = [...prev];
      while (next.length < chosenCompanions) next.push("");
      return next.slice(0, chosenCompanions);
    });
  }, [chosenCompanions]);

  const respond = async (status: "accepted" | "declined") => {
    if (preview) {
      toast.info("هذه معاينة فقط — لن يتم حفظ الردود");
      setMode(null);
      return;
    }
    setSubmitting(true);
    try {
      const payload: { token: string; status: "accepted" | "declined"; notes: string; companions_count?: number; companion_names?: string[] } = {
        token: guest.token,
        status,
        notes: status === "declined" ? wishes.trim() : notes,
      };
      if (status === "accepted") {
        payload.companions_count = chosenCompanions;
        payload.companion_names = companionNames.map((s) => s.trim()).filter(Boolean);
      }
      const r = await submitRsvp({ data: payload });
      setGuest((prev) => ({ ...prev, ...r } as typeof prev));
      toast.success(status === "accepted" ? "شكراً لقبول الدعوة" : "تم تسجيل اعتذارك، شكراً لكلماتك");
      setMode(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  const cal = buildCalendarLinks({
    title: event.name,
    description: event.description || "",
    location: event.location || "",
    start: new Date(startMs),
    durationHours: Math.max(1, Math.round((endMs - startMs) / 3600000)),
  });

  const accepted = guest.rsvp_status === "accepted" || guest.rsvp_status === "attended";
  const declined = guest.rsvp_status === "declined";
  const fullName = guest.title ? `${guest.title} ${guest.name}` : guest.name;

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background: `linear-gradient(180deg, ${bgColor} 0%, ${surface2} 60%, ${bgColor} 100%)`,
        color: textColor,
        fontFamily: "'Tajawal', 'Amiri', system-ui, sans-serif",
      }}
    >
      {preview ? (
        <div className="sticky top-0 z-50 bg-amber-500 px-3 py-1.5 text-center text-xs font-bold text-amber-950 shadow">
          معاينة — بيانات وهمية لاستعراض المظهر
        </div>
      ) : null}
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-3xl opacity-20" style={{ background: accent }} />

      <div className="mx-auto max-w-xl space-y-6 px-4 py-8 sm:py-12">
        {/* Invitation image */}
        <section className="animate-fade-in">
          {tc.invitation_image_url ? (
            <img src={tc.invitation_image_url} alt={event.name} className="block h-auto w-full rounded-3xl shadow-2xl" style={{ border: `1px solid ${cardBorder}` }} />
          ) : (
            <div className="grid aspect-[3/4] place-items-center rounded-3xl border border-dashed text-center" style={{ borderColor: cardBorder }}>
              <p className="px-4 font-display text-3xl font-bold" style={{ color: accent }}>{event.name}</p>
            </div>
          )}
          <p className="mt-4 text-center text-sm" style={{ color: softText }}>
            دعوة موجّهة إلى <span className="font-bold" style={{ color: accent }}>{fullName}</span>
          </p>
        </section>

        {/* Event title + description (dynamic from event form) */}
        {vis.event_name || (vis.description && event.description) ? (
        <section className="animate-fade-in text-center">
          {vis.event_name ? (
            <h1 className="font-display text-4xl font-bold" style={{ color: accent }}>{event.name}</h1>
          ) : null}
          {vis.description && event.description ? (
            <p className="mt-3 text-base leading-relaxed" style={{ color: textColor }}>{event.description}</p>
          ) : null}
        </section>
        ) : null}

        {/* Smart timer */}
        {!declined && (vis.countdown || vis.start_time) ? (
        <section className="animate-fade-in">
          <Card className="border p-6 text-center" style={{ background: cardBg, borderColor: cardBorder, color: textColor }}>
            {phase === "before" && vis.countdown ? (
              <>
                <p className="text-sm font-semibold" style={{ color: softText }}>المتبقي على بداية الحفل</p>
                <div dir="ltr" className="mt-4 grid grid-cols-4 gap-2 text-center">
                  {[
                    { v: cd.d, l: "يوم" },
                    { v: cd.h, l: "ساعة" },
                    { v: cd.m, l: "دقيقة" },
                    { v: cd.s, l: "ثانية" },
                  ].map((u, i) => (
                    <div key={i} className="rounded-xl py-2" style={{ background: accent + "1f", border: `1px solid ${accent}33` }}>
                      <p className="font-display text-2xl font-bold tabular-nums" style={{ color: accent }}>{toArabicDigits(String(u.v).padStart(2, "0"))}</p>
                      <p className="text-[10px]" style={{ color: softText }}>{u.l}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : phase === "during" ? (
              <p className="font-display text-2xl font-bold" style={{ color: accent }}>بدأ الحفل الآن .. أهلاً ومرحباً بكم</p>
            ) : phase === "after" ? (
              <p className="font-display text-3xl font-bold tracking-wide" style={{ color: accent }}>انتهى الحفل</p>
            ) : null}
            {phase !== "after" && vis.start_time ? (
              <>
                <div className="mt-5 inline-block rounded-lg px-4 py-2" style={{ background: accent + "12" }}>
                  <p className="text-[11px]" style={{ color: softText }}>يبدأ الحفل الساعة</p>
                  <p className="text-lg font-bold" style={{ color: textColor }}>{formatArabicClock12(new Date(startMs))}</p>
                </div>
                <p className="mt-3 text-sm" style={{ color: softText }}>{formatArabicFullDate(new Date(startMs))}</p>
                {vis.end_time ? (
                  <p className="mt-2 text-xs" style={{ color: softText }}>ينتهي الساعة {formatArabicClock12(new Date(endMs))}</p>
                ) : null}
              </>
            ) : (
              phase === "after" ? <p className="mt-3 text-xs" style={{ color: softText }}>شكراً لكم على المشاركة</p> : null
            )}
          </Card>
        </section>
        ) : null}

        {/* Location — hidden when guest declined */}
        {!declined && vis.location && (event.location || event.location_url) ? (
          <section className="animate-fade-in">
            <Card className="border p-5" style={{ background: cardBg, borderColor: cardBorder, color: textColor }}>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full" style={{ background: accent, color: onAccent }}>
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs" style={{ color: softText }}>موقع الحفل</p>
                  <p className="truncate font-display text-lg font-bold" style={{ color: textColor }}>{event.location || "—"}</p>
                </div>
              </div>
              {mapEmbedSrc ? (
                <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: cardBorder }}>
                  <iframe
                    title="موقع الحفل"
                    src={mapEmbedSrc}
                    className="block h-56 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                </div>
              ) : null}
              {safeHttpUrl(event.location_url) ? (
                <a href={safeHttpUrl(event.location_url)!} target="_blank" rel="noopener noreferrer" className="mt-4 block">
                  <Button className="w-full" style={{ background: accent, color: onAccent }}>
                    <MapPin className="ms-2 h-4 w-4" /> فتح الموقع على الخريطة
                  </Button>
                </a>
              ) : null}
            </Card>
          </section>
        ) : null}

        {/* RSVP */}
        <section className="animate-fade-in">
          <Card className="border p-6" style={{ background: cardBg, borderColor: cardBorder, color: textColor }}>
            {accepted || declined ? (
              <div className="text-center">
                <Badge style={{ background: RSVP_COLORS[guest.rsvp_status], color: "#fff" }}>{RSVP_LABELS[guest.rsvp_status]}</Badge>
                <p className="mt-3" style={{ color: softText }}>{accepted ? "نتشرف بحضورك" : "نشكر تواصلك"}</p>

                {accepted && phase !== "after" ? (
                  vis.calendar ? (
                  <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <a href={cal.google} target="_blank" rel="noreferrer" dir="ltr"
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-[14px] font-medium leading-none text-[#3c4043] shadow-sm transition hover:bg-[#f8f9fa]">
                      <span className="whitespace-nowrap">Add to Google Calendar</span>
                    </a>
                    <a href={cal.apple} download={`${event.name}.ics`} dir="ltr"
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-black px-4 text-[14px] font-medium leading-none text-white shadow-sm transition hover:bg-neutral-900">
                      <span className="whitespace-nowrap">Add to Apple Calendar</span>
                    </a>
                  </div>
                  ) : null
                ) : null}

                {accepted && (guest.companion_names?.length ?? 0) > 0 ? (
                  <div className="mt-4 rounded-lg p-3 text-right" style={{ background: accent + "18" }}>
                    <p className="text-xs" style={{ color: softText }}>المرافقون ({toArabicDigits(guest.companion_names!.length)})</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      {guest.companion_names!.map((n, i) => <li key={i}>• {n || "—"}</li>)}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : phase === "after" ? (
              <p className="text-center font-display text-2xl font-bold" style={{ color: accent }}>انتهى الحفل</p>
            ) : mode === null ? (
              <div>
                <h2 className="mb-4 text-center font-display text-xl font-bold">هل ستشرفنا بالحضور؟</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => setMode("accept")} className="font-bold" style={{ background: accent, color: onAccent }}>
                    <Check className="ms-2 h-4 w-4" /> حضور
                  </Button>
                  <Button onClick={() => setMode("decline")} variant="outline" style={{ borderColor: accent, color: textColor, background: "transparent" }}>
                    <X className="ms-2 h-4 w-4" /> اعتذار
                  </Button>
                </div>
              </div>
            ) : mode === "accept" ? (
              <div className="space-y-4">
                <h2 className="text-center font-display text-xl font-bold">تأكيد الحضور</h2>
                <div>
                  <Label>ملاحظات (اختياري)</Label>
                  <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-white/10" style={{ color: textColor }} />
                </div>
                {hostCompanions > 0 ? (
                  <div className="space-y-3 rounded-xl border p-3" style={{ borderColor: cardBorder, background: accent + "10" }}>
                    <div className="flex items-center gap-2"><Users className="h-4 w-4" style={{ color: accent }} /><Label>عدد مرافقيك</Label></div>
                    <p className="text-xs" style={{ color: softText }}>
                      حدّد لك المنظم حتى <span className="font-bold" style={{ color: accent }}>{toArabicDigits(hostCompanions)}</span> مرافق. يمكنك تقليل العدد إن أحببت.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: hostCompanions + 1 }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setChosenCompanions(i)}
                          className="h-9 min-w-9 rounded-md px-3 text-sm font-bold transition"
                          style={{
                            background: chosenCompanions === i ? accent : "transparent",
                            color: chosenCompanions === i ? onAccent : textColor,
                            border: `1px solid ${accent}66`,
                          }}
                        >
                          {toArabicDigits(i)}
                        </button>
                      ))}
                    </div>
                    {chosenCompanions > 0 ? (
                      <p className="text-[11px]" style={{ color: softText }}>اكتب أسماء المرافقين (اختياري):</p>
                    ) : null}
                    <div className="space-y-2">
                      {Array.from({ length: chosenCompanions }, (_, i) => (
                        <Input
                          key={i}
                          value={companionNames[i] ?? ""}
                          onChange={(e) => {
                            const next = [...companionNames];
                            next[i] = e.target.value;
                            setCompanionNames(next);
                          }}
                          placeholder={`اسم المرافق ${toArabicDigits(i + 1)} (اختياري)`}
                          className="bg-white/10"
                          style={{ color: textColor }}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="ghost" onClick={() => setMode(null)} disabled={submitting} style={{ color: textColor }}>رجوع</Button>
                  <Button onClick={() => respond("accepted")} disabled={submitting} className="font-bold" style={{ background: accent, color: onAccent }}>تأكيد الحضور</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-center font-display text-xl font-bold">رسالة التهنئة والاعتذار</h2>
                <p className="text-center text-xs" style={{ color: softText }}>شاركنا كلمة بسيطة — سيراها أصحاب المناسبة.</p>
                <Textarea
                  rows={5}
                  value={wishes}
                  onChange={(e) => setWishes(e.target.value.slice(0, 500))}
                  placeholder="مبارك لكم… دامت الأفراح…"
                  className="bg-white/10"
                  style={{ color: textColor }}
                />
                <p className="text-left text-[11px]" style={{ color: softText }}>{toArabicDigits(wishes.length)}/{toArabicDigits(500)}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="ghost" onClick={() => setMode(null)} disabled={submitting} style={{ color: textColor }}>رجوع</Button>
                  <Button onClick={() => respond("declined")} disabled={submitting} className="font-bold" style={{ background: accent, color: onAccent }}>إرسال</Button>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* QR */}
        {qr && !declined && phase !== "after" && vis.qr ? (
          <section className="animate-fade-in">
            <Card className="border p-6 text-center" style={{ background: cardBg, borderColor: cardBorder, color: textColor }}>
              <p className="mb-3 text-sm font-semibold" style={{ color: softText }}>رمز الدخول الخاص بك</p>
              <div className="mx-auto inline-block overflow-hidden rounded-xl" style={{ boxShadow: `0 0 0 4px ${accent}55` }}>
                <img src={qr} alt="QR" className="block" />
              </div>
              {guest.companions_count > 0 ? (
                <p className="mt-3 text-xs" style={{ color: softText }}>هذا الرمز يخصّك ومجموعتك ({toArabicDigits(guest.companions_count + 1)} أشخاص)</p>
              ) : null}
            </Card>
          </section>
        ) : null}
      </div>
    </div>
  );
}