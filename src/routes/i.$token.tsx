import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { type TemplateConfig } from "@/components/invitation-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, MapPin, Clock, Users, Volume2, VolumeX, PartyPopper, CalendarCheck } from "lucide-react";
import { buildCalendarLinks, formatArabicDate, formatArabicTime12, RSVP_LABELS, RSVP_COLORS, safeHttpUrl, toArabicDigits } from "@/lib/event-utils";
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
  // Parse companion names back out of notes if previously stored
  const parseNotes = (raw: string | null): { names: string[]; text: string } => {
    const s = (raw || "").trim();
    const m = s.match(/^المرافقون:\n((?:- .*\n?)+)\n?/);
    if (!m) return { names: [], text: s };
    const names = m[1].split("\n").map(l => l.replace(/^-\s*/, "").trim()).filter(Boolean);
    return { names, text: s.slice(m[0].length).trim() };
  };
  const initialParsed = parseNotes(guest.notes);
  const [notes, setNotes] = useState(initialParsed.text);
  const [companionNames, setCompanionNames] = useState<string[]>(
    Array.from({ length: guest.companions_count }, (_, i) => initialParsed.names[i] || ""),
  );
  const [submitting, setSubmitting] = useState(false);
  const [qr, setQr] = useState<string>("");
  const [now, setNow] = useState(() => Date.now());
  const [showDeclineBox, setShowDeclineBox] = useState(false);
  const [wishes, setWishes] = useState(guest.rsvp_status === "declined" ? initialParsed.text : "");
  const [screenHidden, setScreenHidden] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [palette, setPalette] = useState<{ bg: string; surface: string; text: string; muted: string; accent: string } | null>(null);
  const audioCtxRef = useRef<{ ctx: AudioContext; nodes: OscillatorNode[]; gain: GainNode } | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const ytRef = useRef<HTMLIFrameElement | null>(null);

  const audioCfg = event.template_config?.audio || null;
  const autoplayDefault = (event.template_config?.audio_default || "muted") === "unmuted";
  const ytId = (() => {
    if (audioCfg?.mode !== "youtube" || !audioCfg.src) return "";
    const m = audioCfg.src.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{6,})/);
    return m ? m[1] : "";
  })();
  const pageBg = event.template_config?.page_bg || "";
  const cardImage = event.template_config?.image_url || "";
  const startMs = new Date(event.event_date).getTime();
  const endIso = event.template_config?.event_end || null;
  const endMs = endIso ? new Date(endIso).getTime() : startMs + 4 * 60 * 60 * 1000; // default +4h
  const phase: "before" | "during" | "after" = now < startMs ? "before" : now <= endMs ? "during" : "after";
  const eventOver = phase === "after";

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
          if (ytRef.current) { ytRef.current.src = "about:blank"; }
          setAudioOn(false);
          return;
        }
        if (audioCfg.mode === "youtube" && ytId) {
          if (ytRef.current) {
            ytRef.current.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&loop=1&playlist=${ytId}&controls=0&playsinline=1&rel=0&modestbranding=1`;
          }
        } else if (audioElRef.current) {
          if (!audioElRef.current.src) audioElRef.current.src = audioCfg.src;
          audioElRef.current.loop = true;
          audioElRef.current.muted = false;
          audioElRef.current.volume = 1;
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

  // Attempt autoplay on first user interaction (browsers block silent autoplay).
  useEffect(() => {
    if (!autoplayDefault || !audioCfg?.src) return;
    let done = false;
    const tryPlay = () => {
      if (done) return;
      done = true;
      toggleAudio();
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
      window.removeEventListener("touchstart", tryPlay);
    };
    // First, attempt direct autoplay (works on some browsers when the page has been interacted with already)
    const t = setTimeout(() => { tryPlay(); }, 400);
    window.addEventListener("pointerdown", tryPlay, { once: true });
    window.addEventListener("keydown", tryPlay, { once: true });
    window.addEventListener("touchstart", tryPlay, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
      window.removeEventListener("touchstart", tryPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplayDefault, audioCfg?.src]);

  useEffect(() => {
    if (guest.rsvp_status === "accepted" || guest.rsvp_status === "attended") {
      QRCode.toDataURL(`${window.location.origin}/i/${guest.token}`, { width: 320, margin: 2, color: { dark: "#1a1410", light: "#f7f1e6" } }).then(setQr);
    }
  }, [guest.rsvp_status, guest.token]);

  useEffect(() => {
    // Single ticker, cleared on unmount → no memory leaks between phase transitions.
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Extract dominant color from uploaded card image to derive a harmonious page palette.
  useEffect(() => {
    if (!cardImage) { setPalette(null); return; }
    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const c = document.createElement("canvas");
        const w = (c.width = 48), h = (c.height = 48);
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const d = ctx.getImageData(0, 0, w, h).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          const a = d[i + 3];
          if (a < 200) continue;
          r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
        }
        if (!n) return;
        r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
        // Soften — push toward darker, richer base for backdrop
        const mix = (v: number, t: number, p: number) => Math.round(v * (1 - p) + t * p);
        const bgR = mix(r, 18, 0.55), bgG = mix(g, 14, 0.55), bgB = mix(b, 12, 0.55);
        const surfR = mix(r, 10, 0.78), surfG = mix(g, 10, 0.78), surfB = mix(b, 10, 0.78);
        // YIQ luminance of the bg to pick contrasting text color
        const yiq = (bgR * 299 + bgG * 587 + bgB * 114) / 1000;
        const text = yiq > 140 ? "#15110b" : "#fbf6ec";
        const muted = yiq > 140 ? "rgba(20,16,12,0.65)" : "rgba(251,246,236,0.75)";
        const accent = `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 25)}, ${Math.max(40, b - 10)})`;
        setPalette({
          bg: `linear-gradient(180deg, rgb(${bgR},${bgG},${bgB}) 0%, rgb(${Math.max(0, bgR - 20)},${Math.max(0, bgG - 20)},${Math.max(0, bgB - 20)}) 60%, #0a0807 100%)`,
          surface: `rgba(${surfR},${surfG},${surfB},0.55)`,
          text,
          muted,
          accent,
        });
      } catch {
        // CORS or other failure — keep default palette
      }
    };
    img.src = cardImage;
    return () => { cancelled = true; };
  }, [cardImage]);

  const deadlineIso = event.template_config?.rsvp_deadline || null;
  const deadlinePassed = !!deadlineIso && new Date(deadlineIso).getTime() < Date.now();

  const buildNotesForSubmit = (status: "accepted" | "declined", text: string): string => {
    if (status === "accepted") {
      const names = companionNames.map(n => n.trim()).filter(Boolean);
      const header = names.length ? `المرافقون:\n${names.map(n => `- ${n}`).join("\n")}\n\n` : "";
      return (header + text).trim();
    }
    // Declined → companion data is irrelevant, save only the wishes.
    return text.trim();
  };

  const respond = async (status: "accepted" | "declined", textOverride?: string) => {
    if (deadlinePassed) {
      toast.error("انتهت الفترة المحددة لتأكيد الحضور");
      return;
    }
    if (eventOver) {
      toast.error("انتهى الحفل، لا يمكن تسجيل ردك الآن");
      return;
    }
    setSubmitting(true);
    try {
      const baseText = textOverride !== undefined ? textOverride : (status === "declined" ? wishes : notes);
      const finalNotes = buildNotesForSubmit(status, baseText);
      if (status === "declined") {
        // Reset companion-only state so we never ship stale data to the host.
        setCompanionNames(Array.from({ length: guest.companions_count }, () => ""));
      }
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
  const dynBg = palette?.bg || pageBg || "";
  const surface = palette?.surface || "rgba(0,0,0,0.45)";
  const textColor = palette?.text || "#fbf6ec";
  const mutedColor = palette?.muted || "rgba(251,246,236,0.7)";

  const fmtCountdown = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return d > 0
      ? `${toArabicDigits(d)} يوم · ${toArabicDigits(pad(h))}:${toArabicDigits(pad(m))}:${toArabicDigits(pad(s))}`
      : `${toArabicDigits(pad(h))}:${toArabicDigits(pad(m))}:${toArabicDigits(pad(s))}`;
  };

  const showQr = accepted && !eventOver;

  return (
    <div
      dir="rtl"
      className={`relative min-h-screen overflow-x-hidden ${dynBg ? "" : "bg-gradient-to-b from-[#1a1410] via-[#2a1f17] to-[#0f0a07]"}`}
      style={{
        ["--lux-accent" as string]: accent,
        color: textColor,
        ...(dynBg ? { background: dynBg } : {}),
      } as React.CSSProperties}
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
      {/* Hidden audio sources controlled by the floating toggle */}
      {audioCfg?.mode === "youtube" && ytId ? (
        <iframe
          ref={ytRef}
          title="bg-audio"
          width="1" height="1"
          allow="autoplay; encrypted-media"
          style={{ position: "fixed", inset: 0, opacity: 0, pointerEvents: "none", width: 1, height: 1 }}
          src=""
        />
      ) : (audioCfg?.mode === "url" || audioCfg?.mode === "file") ? (
        <audio ref={audioElRef} preload="auto" playsInline />
      ) : null}

      {/* Screenshot guard overlay */}
      {screenHidden ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/80 backdrop-blur-2xl">
          <div className="text-center text-gold">
            <p className="font-display text-2xl font-bold">الدعوة مخفية</p>
            <p className="mt-2 text-sm text-white/70">عُد إلى الصفحة لعرض دعوتك</p>
          </div>
        </div>
      ) : null}

      <div className={`relative mx-auto max-w-2xl ${screenHidden ? "screenshot-guard" : ""}`}>
        {/* === Section 1 — Full-bleed invitation image hero === */}
        <section className="lux-fade-up relative mx-auto flex min-h-[92vh] w-full max-w-2xl flex-col items-center justify-center px-3 py-6 sm:px-4 sm:py-10">
          {cardImage ? (
            <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl ring-1" style={{ borderColor: accent + "55" }}>
              <img
                src={cardImage}
                alt={event.name}
                className="block w-full select-none object-contain"
                draggable={false}
              />
            </div>
          ) : (
            <Card className="w-full border-gold/30 bg-black/30 p-10 text-center backdrop-blur" style={{ color: textColor }}>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: mutedColor }}>دعوة كريمة</p>
              <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">{event.name}</h1>
              <p className="mt-3" style={{ color: mutedColor }}>{guest.title ? `${guest.title} ${guest.name}` : guest.name}</p>
            </Card>
          )}
          <p className="mt-6 text-center text-sm" style={{ color: mutedColor }}>
            {guest.title ? `${guest.title} ` : ""}<span className="font-bold" style={{ color: accent }}>{guest.name}</span>
          </p>
        </section>

        <div className="space-y-5 px-3 pb-14 sm:px-4">
          {/* === Section 2 — Smart timer === */}
          <Card className="lux-fade-up border-gold/30 p-6 text-center backdrop-blur" style={{ background: surface, color: textColor, borderColor: accent + "55" }}>
            {phase === "before" ? (
              <>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: mutedColor }}>متبقي على بداية الحفل</p>
                <p className="mt-3 font-display text-3xl font-bold tabular-nums" style={{ color: accent }}>
                  {fmtCountdown(startMs - now)}
                </p>
                <p className="mt-3 text-xs" style={{ color: mutedColor }}>
                  يبدأ {formatArabicDate(event.event_date)} · {formatArabicTime12(new Date(event.event_date).toISOString().slice(11, 16))}
                </p>
              </>
            ) : phase === "during" ? (
              <>
                <PartyPopper className="mx-auto h-10 w-10" style={{ color: accent }} />
                <p className="mt-3 font-display text-2xl font-bold">بدأ الحفل الآن .. أهلاً ومرحباً بكم</p>
                {endIso ? (
                  <p className="mt-2 text-xs" style={{ color: mutedColor }}>ينتهي {formatArabicTime12(new Date(endMs).toISOString().slice(11, 16))}</p>
                ) : null}
              </>
            ) : (
              <>
                <CalendarCheck className="mx-auto h-10 w-10" style={{ color: accent }} />
                <p className="mt-3 font-display text-2xl font-bold">انتهى الحفل .. شكراً للحضور</p>
              </>
            )}
          </Card>

          {/* === Section 3 — Location === */}
          {event.location || safeHttpUrl(event.location_url) ? (
            <Card className="lux-fade-up border-gold/30 p-5 backdrop-blur" style={{ background: surface, color: textColor, borderColor: accent + "55" }}>
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: accent + "33" }}>
                  <MapPin className="h-5 w-5" style={{ color: accent }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-widest" style={{ color: mutedColor }}>موقع الحفل</p>
                  <p className="mt-1 font-display text-lg font-bold break-words">{event.location || "—"}</p>
                </div>
              </div>
              {safeHttpUrl(event.location_url) ? (
                <a href={safeHttpUrl(event.location_url)!} target="_blank" rel="noopener noreferrer" className="mt-4 block">
                  <Button className="w-full gold-gradient text-primary-foreground">
                    <MapPin className="ms-2 h-4 w-4" /> فتح الموقع على الخريطة
                  </Button>
                </a>
              ) : null}
            </Card>
          ) : null}

          {/* === Section 4 — RSVP & companions === */}
          {eventOver ? null : !accepted && !declined && !deadlinePassed ? (
            <Card className="lux-fade-up border-gold/30 p-6 backdrop-blur" style={{ background: surface, color: textColor, borderColor: accent + "55" }}>
              <h2 className="mb-4 text-center font-display text-xl font-bold">هل ستشرفنا بالحضور؟</h2>
              {!showDeclineBox ? (
                <div className="space-y-4">
                  {guest.companions_count > 0 ? (
                    <div className="space-y-3 rounded-2xl border p-4" style={{ borderColor: accent + "44", background: "rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" style={{ color: accent }} />
                          <p className="text-sm font-medium">المرافقون المخصصون لك</p>
                        </div>
                        <Badge variant="outline" style={{ borderColor: accent, color: accent }}>{toArabicDigits(guest.companions_count)}</Badge>
                      </div>
                      <p className="text-xs" style={{ color: mutedColor }}>اكتب أسماء المرافقين (اختياري) لتسهيل استقبالهم.</p>
                      <div className="space-y-2">
                        {companionNames.map((nm, i) => (
                          <Input
                            key={i}
                            value={nm}
                            onChange={(e) => {
                              const next = [...companionNames];
                              next[i] = e.target.value.slice(0, 80);
                              setCompanionNames(next);
                            }}
                            placeholder={`المرافق ${toArabicDigits(i + 1)}`}
                            className="bg-white/10 text-right"
                            style={{ color: textColor }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <Label>ملاحظات خاصة (اختياري — احتياجات غذائية، إعاقة…)</Label>
                    <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="bg-white/10" style={{ color: textColor }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => respond("accepted")} disabled={submitting} className="gold-gradient text-primary-foreground"><Check className="ms-2 h-4 w-4" /> أقبل الدعوة</Button>
                    <Button onClick={() => setShowDeclineBox(true)} disabled={submitting} variant="outline" className="border-gold/40 hover:bg-white/10" style={{ color: textColor }}><X className="ms-2 h-4 w-4" /> أعتذر</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-2xl border p-5" style={{ borderColor: accent + "55", background: "rgba(0,0,0,0.25)" }}>
                  <div className="text-center">
                    <p className="font-display text-lg font-bold" style={{ color: accent }}>رسالة التهنئة والاعتذار</p>
                    <p className="mt-1 text-xs" style={{ color: mutedColor }}>شاركنا كلمة تبريك أو اعتذار رقيق — سيراها أصحاب المناسبة.</p>
                  </div>
                  <Textarea
                    rows={4}
                    value={wishes}
                    onChange={e => setWishes(e.target.value.slice(0, 500))}
                    placeholder="مبارك لكم… دامت الأفراح…"
                    className="bg-white/10 text-right"
                    style={{ color: textColor }}
                  />
                  <p className="text-left text-[11px]" style={{ color: mutedColor }}>{toArabicDigits(wishes.length)}/{toArabicDigits(500)}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="ghost" onClick={() => setShowDeclineBox(false)} disabled={submitting} className="hover:bg-white/10" style={{ color: textColor }}>رجوع</Button>
                    <Button onClick={() => respond("declined", wishes.trim())} disabled={submitting} className="gold-gradient text-primary-foreground">
                      إرسال الاعتذار والتبريكات
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ) : !accepted && !declined && deadlinePassed ? (
            <Card className="lux-fade-up border-gold/30 p-6 text-center backdrop-blur" style={{ background: surface, color: textColor, borderColor: accent + "55" }}>
              <Clock className="mx-auto h-10 w-10" style={{ color: accent }} />
              <p className="mt-3 font-display text-lg font-bold">نعتذر منك</p>
              <p className="mt-1 text-sm" style={{ color: mutedColor }}>لقد انتهت الفترة المحددة لتأكيد الحضور.</p>
            </Card>
          ) : (
            <Card className="lux-fade-up border-gold/30 p-6 text-center backdrop-blur" style={{ background: surface, color: textColor, borderColor: accent + "55" }}>
              <Badge style={{ background: RSVP_COLORS[guest.rsvp_status], color: "#fff" }}>{RSVP_LABELS[guest.rsvp_status]}</Badge>
              <p className="mt-3" style={{ color: mutedColor }}>{accepted ? "نتشرف بحضورك" : "نشكر تواصلك"}</p>
              {accepted ? (
                <>
                  <p className="mt-6 text-xs uppercase tracking-[0.3em]" style={{ color: mutedColor }}>إضافة إلى التقويم</p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <a
                      href={cal.google}
                      target="_blank"
                      rel="noreferrer"
                      dir="ltr"
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-[14px] font-medium leading-none text-[#3c4043] shadow-sm transition hover:bg-[#f8f9fa] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40"
                    >
                      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden className="shrink-0">
                        <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      <span className="whitespace-nowrap">Add to Google Calendar</span>
                    </a>
                    <a
                      href={cal.apple}
                      download={`${event.name}.ics`}
                      dir="ltr"
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-black/30 bg-black px-4 text-[14px] font-medium leading-none text-white shadow-sm transition hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-white/30"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
                        <path d="M16.365 1.43c0 1.14-.49 2.23-1.27 3.03-.83.85-2.18 1.5-3.29 1.41-.13-1.12.43-2.27 1.21-3.05.86-.88 2.31-1.52 3.35-1.39zM20.5 17.46c-.55 1.27-.82 1.84-1.54 2.95-1 1.55-2.41 3.48-4.15 3.5-1.55.02-1.95-1.01-4.06-1-2.11.01-2.55 1.02-4.1 1-1.74-.02-3.07-1.77-4.07-3.32C-.27 17.27-.74 11.86 1.42 8.99c1.5-2.01 3.86-3.18 6.07-3.18 2.27 0 3.69 1.24 5.57 1.24 1.82 0 2.93-1.24 5.55-1.24 1.98 0 4.07 1.08 5.56 2.93-4.89 2.68-4.09 9.66.33 11.72z"/>
                      </svg>
                      <span className="whitespace-nowrap">Add to Apple Calendar</span>
                    </a>
                  </div>
                </>
              ) : null}
            </Card>
          )}

          {/* === Section 5 — Single unified QR (hidden if declined or event ended) === */}
          {showQr && qr ? (
            <Card className="lux-fade-up border-gold/30 p-6 text-center backdrop-blur" style={{ background: surface, color: textColor, borderColor: accent + "55" }}>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: mutedColor }}>رمز الدخول الموحد لك ولمجموعتك</p>
              <div className="mx-auto mt-4 inline-block overflow-hidden rounded-xl ring-2" style={{ background: "#fff", padding: 8, boxShadow: `0 0 0 2px ${accent}66` }}>
                <img src={qr} alt="QR" className="block h-56 w-56" />
              </div>
              <p className="mt-3 text-xs" style={{ color: mutedColor }}>اعرض هذا الرمز عند الاستقبال</p>
            </Card>
          ) : null}

          <p className="text-center text-xs" style={{ color: mutedColor }}>تاريخ الفعالية: {formatArabicDate(event.event_date)}</p>
        </div>
      </div>
    </div>
  );
}