import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { InvitationCard, type TemplateConfig } from "@/components/invitation-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, MapPin, Clock, Users, Volume2, VolumeX } from "lucide-react";
import { buildCalendarLinks, formatArabicDate, RSVP_LABELS, RSVP_COLORS, safeHttpUrl } from "@/lib/event-utils";
import { toast } from "sonner";
import QRCode from "qrcode";
import { getInvitation, submitRsvp } from "@/lib/invitation.functions";

type LoaderData = {
  guest: { id: string; token: string; name: string; title?: string | null; rsvp_status: string; companions_count: number; notes: string | null };
  event: { id: string; name: string; event_type: string; event_date: string; location: string | null; location_url: string | null; description: string | null; template_config: TemplateConfig };
};

export const Route = createFileRoute("/i/$token")({
  ssr: false,
  head: () => ({ meta: [{ title: "دعوتك — دعوتي" }] }),
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
  const { guest: initialGuest, event } = Route.useLoaderData() as LoaderData;
  const [guest, setGuest] = useState(initialGuest);
  const [notes, setNotes] = useState(guest.notes || "");
  const [submitting, setSubmitting] = useState(false);
  const [qr, setQr] = useState<string>("");
  const [countdown, setCountdown] = useState("");
  const [showDeclineBox, setShowDeclineBox] = useState(false);
  const [wishes, setWishes] = useState("");
  const [screenHidden, setScreenHidden] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const audioCtxRef = useRef<{ ctx: AudioContext; nodes: OscillatorNode[]; gain: GainNode } | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const ytRef = useRef<HTMLIFrameElement | null>(null);

  const audioCfg = event.template_config?.audio || null;
  const ytId = (() => {
    if (audioCfg?.mode !== "youtube" || !audioCfg.src) return "";
    const m = audioCfg.src.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{6,})/);
    return m ? m[1] : "";
  })();

  // Screenshot protection — blur whenever the tab/app loses focus or visibility changes.
  useEffect(() => {
    const hide = () => setScreenHidden(true);
    const show = () => setScreenHidden(false);
    const onVis = () => (document.hidden ? hide() : show());
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Audio toggle — uses host-configured source (YouTube/URL/upload) when provided,
  // otherwise falls back to a synthesized ambient drone.
  const toggleAudio = async () => {
    try {
      // ---- Configured source path ----
      if (audioCfg && audioCfg.src) {
        if (audioOn) {
          if (audioElRef.current) { audioElRef.current.pause(); }
          if (ytRef.current) { ytRef.current.src = ""; }
          setAudioOn(false);
          return;
        }
        if (audioCfg.mode === "youtube" && ytId) {
          if (ytRef.current) {
            ytRef.current.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&loop=1&playlist=${ytId}&controls=0`;
          }
        } else if (audioElRef.current) {
          audioElRef.current.src = audioCfg.src;
          audioElRef.current.loop = true;
          await audioElRef.current.play();
        }
        setAudioOn(true);
        return;
      }
      // ---- Fallback synthesized drone ----
      if (audioOn && audioCtxRef.current) {
        audioCtxRef.current.gain.gain.linearRampToValueAtTime(0, audioCtxRef.current.ctx.currentTime + 0.4);
        setTimeout(() => { audioCtxRef.current?.ctx.close(); audioCtxRef.current = null; }, 500);
        setAudioOn(false);
        return;
      }
      const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      const freqs = [196, 246.94, 392]; // soft G major triad pad
      const nodes = freqs.map((f, i) => {
        const o = ctx.createOscillator();
        o.type = i === 0 ? "sine" : "triangle";
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = i === 0 ? 0.18 : 0.08;
        o.connect(g); g.connect(gain); o.start();
        return o;
      });
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.2);
      audioCtxRef.current = { ctx, nodes, gain };
      setAudioOn(true);
    } catch {
      toast.error("تعذّر تشغيل الصوت في هذا المتصفح");
    }
  };
  useEffect(() => () => { audioCtxRef.current?.ctx.close(); }, []);

  useEffect(() => {
    if (guest.rsvp_status === "accepted" || guest.rsvp_status === "attended") {
      QRCode.toDataURL(`${window.location.origin}/i/${guest.token}`, { width: 320, margin: 2, color: { dark: "#1a1410", light: "#f7f1e6" } }).then(setQr);
    }
  }, [guest.rsvp_status, guest.token]);

  useEffect(() => {
    const t = setInterval(() => {
      const diff = new Date(event.event_date).getTime() - Date.now();
      if (diff <= 0) { setCountdown("بدأت الفعالية"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${d} يوم · ${h} ساعة · ${m} دقيقة`);
    }, 30000);
    return () => clearInterval(t);
  }, [event.event_date]);

  const deadlineIso = event.template_config?.rsvp_deadline || null;
  const deadlinePassed = !!deadlineIso && new Date(deadlineIso).getTime() < Date.now();

  const respond = async (status: "accepted" | "declined", noteOverride?: string) => {
    if (deadlinePassed) {
      toast.error("انتهت الفترة المحددة لتأكيد الحضور");
      return;
    }
    setSubmitting(true);
    try {
      const finalNotes = noteOverride !== undefined ? noteOverride : notes;
      await submitRsvp({ data: { token: guest.token, status, notes: finalNotes } });
      setGuest(prev => ({ ...prev, rsvp_status: status, notes: finalNotes }));
      toast.success(status === "accepted" ? "شكراً لقبول الدعوة" : "تم تسجيل اعتذارك وإرسال تبريكاتك");
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
    start: new Date(event.event_date),
  });

  const accepted = guest.rsvp_status === "accepted" || guest.rsvp_status === "attended";
  const declined = guest.rsvp_status === "declined";

  const accent = event.template_config?.accent_color || "#c9a24a";

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#1a1410] via-[#2a1f17] to-[#0f0a07] px-3 py-6 sm:px-4 sm:py-10"
      style={{ ["--lux-accent" as string]: accent } as React.CSSProperties}
    >
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-3xl opacity-30" style={{ background: accent }} />
      <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full blur-3xl opacity-20" style={{ background: accent }} />

      {/* Floating audio toggle */}
      <button
        type="button"
        onClick={toggleAudio}
        aria-label={audioOn ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
        className="fixed bottom-5 left-5 z-30 grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-black/60 text-gold shadow-xl backdrop-blur transition hover:scale-105"
      >
        {audioOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>

      {/* Screenshot guard overlay */}
      {screenHidden ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/80 backdrop-blur-2xl">
          <div className="text-center text-gold">
            <p className="font-display text-2xl font-bold">الدعوة مخفية</p>
            <p className="mt-2 text-sm text-white/70">عُد إلى الصفحة لعرض دعوتك</p>
          </div>
        </div>
      ) : null}

      <div className={`relative mx-auto max-w-2xl space-y-5 ${screenHidden ? "screenshot-guard" : ""}`}>
        <div className="lux-fade-up [animation-delay:0ms]">
        <InvitationCard
          config={event.template_config}
          eventName={event.name}
          eventDate={event.event_date}
          location={event.location}
          guestName={guest.title ? `${guest.title} ${guest.name}` : guest.name}
        />
        </div>

        <Card className="lux-fade-up border-gold/30 bg-black/30 p-6 text-center backdrop-blur [animation-delay:120ms]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">يبدأ خلال</p>
          <p className="mt-3 font-display text-3xl font-bold text-gold">{countdown}</p>
        </Card>

        {guest.companions_count > 0 ? (
          <Card className="lux-fade-up flex items-center justify-between gap-3 border-gold/30 bg-black/30 p-4 backdrop-blur [animation-delay:200ms]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full gold-gradient text-primary-foreground">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-white/60">عدد المرافقين المخصّص لك</p>
                <p className="font-display text-lg font-bold text-white">{guest.companions_count}</p>
              </div>
            </div>
            <Badge variant="outline" className="border-gold/50 text-xs text-gold">من قِبَل المضيف</Badge>
          </Card>
        ) : null}

        {safeHttpUrl(event.location_url) ? (
          <a href={safeHttpUrl(event.location_url)!} target="_blank" rel="noopener noreferrer" className="lux-fade-up block [animation-delay:260ms]">
            <Button variant="outline" className="w-full"><MapPin className="ms-2 h-4 w-4" /> فتح الموقع على الخريطة</Button>
          </a>
        ) : null}

        {!accepted && !declined && !deadlinePassed ? (
          <Card className="lux-fade-up border-gold/30 bg-black/40 p-6 text-white backdrop-blur [animation-delay:320ms]">
            <h2 className="mb-4 text-center font-display text-xl font-bold">هل ستشرفنا بالحضور؟</h2>
            <div className="space-y-4">
              {!showDeclineBox ? (
                <>
                  <div>
                    <Label>ملاحظات خاصة (اختياري — احتياجات غذائية، إعاقة…)</Label>
                    <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="bg-white/5 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => respond("accepted")} disabled={submitting} className="gold-gradient text-primary-foreground"><Check className="ms-2 h-4 w-4" /> أقبل الدعوة</Button>
                    <Button onClick={() => setShowDeclineBox(true)} disabled={submitting} variant="outline" className="border-gold/40 text-white hover:bg-white/10"><X className="ms-2 h-4 w-4" /> أعتذر</Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 rounded-2xl border border-gold/40 bg-black/30 p-5">
                  <div className="text-center">
                    <p className="font-display text-lg font-bold text-gold">صندوق التبريكات والتهاني</p>
                    <p className="mt-1 text-xs text-white/70">شاركنا كلمة تبريك أو اعتذار رقيق — سيراها أصحاب المناسبة.</p>
                  </div>
                  <Textarea
                    rows={4}
                    value={wishes}
                    onChange={e => setWishes(e.target.value.slice(0, 500))}
                    placeholder="مبارك لكم… دامت الأفراح…"
                    className="bg-white/5 text-right text-white"
                  />
                  <p className="text-left text-[11px] text-white/60">{wishes.length}/500</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="ghost" onClick={() => setShowDeclineBox(false)} disabled={submitting} className="text-white hover:bg-white/10">رجوع</Button>
                    <Button
                      onClick={() => respond("declined", wishes.trim())}
                      disabled={submitting}
                      className="gold-gradient text-primary-foreground"
                    >
                      إرسال الاعتذار والتبريكات
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : !accepted && !declined && deadlinePassed ? (
          <Card className="lux-fade-up border-gold/30 bg-black/40 p-6 text-center text-white backdrop-blur">
            <Clock className="mx-auto h-10 w-10 text-gold" />
            <p className="mt-3 font-display text-lg font-bold">نعتذر منك</p>
            <p className="mt-1 text-sm text-white/70">لقد انتهت الفترة المحددة لتأكيد الحضور.</p>
            {deadlineIso ? <p className="mt-2 text-xs text-white/60">المهلة: {formatArabicDate(deadlineIso)}</p> : null}
          </Card>
        ) : (
          <Card className="lux-fade-up border-gold/30 bg-black/40 p-6 text-center text-white backdrop-blur [animation-delay:320ms]">
            <Badge style={{ background: RSVP_COLORS[guest.rsvp_status], color: "#fff" }}>{RSVP_LABELS[guest.rsvp_status]}</Badge>
            <p className="mt-3 text-white/70">{accepted ? "نتشرف بحضورك" : "نشكر تواصلك"}</p>
            {accepted ? (
              <>
                <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/50">إضافة إلى التقويم</p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <a href={cal.google} target="_blank" rel="noreferrer" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white text-[14px] font-medium text-[#3c4043] shadow-sm transition hover:bg-[#f8f9fa]">
                    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                      <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    إضافة إلى Google
                  </a>
                  <a href={cal.apple} download={`${event.name}.ics`} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-black text-[14px] font-medium text-white shadow-sm transition hover:bg-neutral-800">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M16.365 1.43c0 1.14-.49 2.23-1.27 3.03-.83.85-2.18 1.5-3.29 1.41-.13-1.12.43-2.27 1.21-3.05.86-.88 2.31-1.52 3.35-1.39zM20.5 17.46c-.55 1.27-.82 1.84-1.54 2.95-1 1.55-2.41 3.48-4.15 3.5-1.55.02-1.95-1.01-4.06-1-2.11.01-2.55 1.02-4.1 1-1.74-.02-3.07-1.77-4.07-3.32C-.27 17.27-.74 11.86 1.42 8.99c1.5-2.01 3.86-3.18 6.07-3.18 2.27 0 3.69 1.24 5.57 1.24 1.82 0 2.93-1.24 5.55-1.24 1.98 0 4.07 1.08 5.56 2.93-4.89 2.68-4.09 9.66.33 11.72z"/>
                    </svg>
                    إضافة إلى Apple
                  </a>
                </div>
                {qr ? (
                  <div className="mt-6">
                    <p className="mb-2 text-sm text-white/70">رمز الدخول الخاص بك</p>
                    <div className="mx-auto inline-block overflow-hidden rounded-xl ring-2 ring-gold/40">
                      <img src={qr} alt="QR" className="block" />
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </Card>
        )}

        <p className="lux-fade-up text-center text-xs text-white/60 [animation-delay:420ms]">تاريخ الفعالية: {formatArabicDate(event.event_date)}</p>
      </div>
    </div>
  );
}