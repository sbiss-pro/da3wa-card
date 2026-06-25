import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { InvitationCard, type TemplateConfig } from "@/components/invitation-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, Calendar, MapPin, Download, Apple, Clock, Users, Volume2, VolumeX } from "lucide-react";
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

  // Synthesized ambient drone — no external assets required.
  const toggleAudio = async () => {
    try {
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
                <div className="mt-6 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <a href={cal.google} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full"><Calendar className="ms-2 h-4 w-4" /> Google Calendar</Button></a>
                  <a href={cal.apple} download={`${event.name}.ics`}><Button variant="outline" className="w-full"><Apple className="ms-2 h-4 w-4" /> Apple Calendar</Button></a>
                </div>
                {qr ? (
                  <div className="mt-6">
                    <p className="mb-2 text-sm text-white/70">رمز الدخول الخاص بك</p>
                    <div className="mx-auto inline-block overflow-hidden rounded-xl ring-2 ring-gold/40">
                      <img src={qr} alt="QR" className="block" />
                    </div>
                    <a href={qr} download={`invite-${guest.name}.png`}><Button variant="outline" size="sm" className="mt-3"><Download className="ms-2 h-4 w-4" /> تحميل الرمز</Button></a>
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