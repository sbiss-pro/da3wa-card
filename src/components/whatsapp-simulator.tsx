import { useEffect, useRef, useState } from "react";
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
  Paperclip,
  Smile,
  Send,
  Mic,
  Camera,
  MoreVertical,
  RotateCcw,
} from "lucide-react";

type Msg = {
  id: string;
  from: "me" | "them";
  time: string;
  text?: string;
  imageUrl?: string;
  showButtons?: boolean;
  kind?: "text" | "location";
  locationTitle?: string;
  locationUrl?: string;
};

const now = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};
const uid = () => Math.random().toString(36).slice(2, 9);

function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/\S+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a
            key={i}
            href={p}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sky-300 underline underline-offset-2 break-all"
          >
            {p}
          </a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

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
  const buildInitial = (): Msg[] => [
    {
      id: "initial",
      from: "me",
      time: "",
      text: initialMessage,
      imageUrl,
      showButtons: true,
    },
  ];
  const [messages, setMessages] = useState<Msg[]>(buildInitial);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [rsvp, setRsvp] = useState<"accepted" | "declined" | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Set the initial timestamp on the client only to avoid SSR hydration mismatch.
  useEffect(() => {
    setMessages((m) =>
      m.length === 1 && m[0].id === "initial" && !m[0].time
        ? [{ ...m[0], time: now() }]
        : m,
    );
  }, []);

  const handleReset = () => {
    setInput("");
    setTyping(false);
    setRsvp(null);
    setMessages(buildInitial().map((m) => ({ ...m, time: now() })));
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const pushGuest = (text: string) => {
    setMessages((m) => [
      ...m,
      { id: uid(), from: "them", time: now(), text },
    ]);
  };

  const pushHostAfterDelay = (build: () => Msg, delay = 900) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, build()]);
    }, delay);
  };

  const handleAccept = () => {
    if (rsvp) return;
    setRsvp("accepted");
    pushGuest("سأحضر بإذن الله ✅");
    pushHostAfterDelay(() => ({
      id: uid(),
      from: "me",
      time: now(),
      text:
        `شكراً لتأكيدكم الحضور 🌹\n\n` +
        `📅 اليوم: ${eventDetails.day}\n` +
        `🗓️ التاريخ: ${eventDetails.date}\n` +
        `⏰ الوقت: ${eventDetails.time}\n` +
        `📍 الموقع: ${eventDetails.location}\n` +
        `🔗 رابط الموقع: ${eventDetails.locationUrl}\n\n` +
        `بانتظاركم — وجودكم يسعدنا 🤍`,
    }));
  };

  const handleDecline = () => {
    if (rsvp) return;
    setRsvp("declined");
    pushGuest("أعتذر عن عدم الحضور 🙏");
    pushHostAfterDelay(() => ({
      id: uid(),
      from: "me",
      time: now(),
      text:
        "شكراً لإبلاغنا 🌹\nنقدّر لكم اعتذاركم، ونتمنى لكم دوام التوفيق.\nنلتقي في مناسبات قادمة بإذن الله 🤍",
    }));
  };

  const handleLocation = () => {
    pushGuest("أين الموقع؟ 📍");
    pushHostAfterDelay(
      () => ({
        id: uid(),
        from: "me",
        time: now(),
        kind: "location",
        locationTitle: eventDetails.location,
        locationUrl: eventDetails.locationUrl,
      }),
      700,
    );
  };

  const handleSend = () => {
    const v = input.trim();
    if (!v) return;
    setInput("");
    pushGuest(v);
    pushHostAfterDelay(() => ({
      id: uid(),
      from: "me",
      time: now(),
      text: "شكراً لتواصلكم 🌹 — سيصلكم الرد قريباً.",
    }));
  };

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[340px]">
      {/* Phone bezel */}
      <div className="relative rounded-[2.4rem] border border-border bg-neutral-900 p-2 shadow-2xl">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-neutral-900" />
        {/* Screen — fixed height */}
        <div className="flex h-[620px] flex-col overflow-hidden rounded-[2rem] bg-[#0b141a] text-white">
          {/* WA header */}
          <div className="flex shrink-0 items-center justify-between gap-2 bg-[#005c4b] px-3 pb-2 pt-7">
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 opacity-80" />
              <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-[13px] font-semibold">{senderName}</p>
                <p className="text-[10px] opacity-80">
                  {typing ? "يكتب…" : "متصل الآن"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 opacity-80">
              <Video className="h-4 w-4" />
              <Phone className="h-4 w-4" />
              <MoreVertical className="h-4 w-4" />
            </div>
          </div>

          {/* Chat area (scrollable) */}
          <div
            ref={scrollerRef}
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

            {messages.map((m) => (
              <Bubble
                key={m.id}
                msg={m}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onLocation={handleLocation}
                rsvp={rsvp}
              />
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-[#202c33] px-3 py-2 text-[13px] shadow">
                  <span className="dot-typing" />
                  <span className="dot-typing" style={{ animationDelay: "0.15s" }} />
                  <span className="dot-typing" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="shrink-0 bg-[#0b141a] px-2 pb-2 pt-1">
            <div className="flex items-end gap-1.5">
              <div className="flex flex-1 items-center gap-1 rounded-full bg-[#202c33] px-3 py-1.5">
                <button
                  type="button"
                  className="text-white/70 transition hover:text-white"
                  aria-label="إيموجي"
                >
                  <Smile className="h-5 w-5" />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="اكتب رسالة"
                  className="min-w-0 flex-1 bg-transparent px-1 py-1 text-right text-[13px] text-white placeholder:text-white/50 focus:outline-none"
                />
                <button
                  type="button"
                  className="text-white/70 transition hover:text-white"
                  aria-label="إرفاق"
                >
                  <Paperclip className="h-5 w-5 -rotate-45" />
                </button>
                <button
                  type="button"
                  className="text-white/70 transition hover:text-white"
                  aria-label="كاميرا"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleSend}
                aria-label={input.trim() ? "إرسال" : "تسجيل صوتي"}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#00a884] text-white transition hover:bg-[#019277] active:scale-95"
              >
                {input.trim() ? (
                  <Send className="h-4 w-4 -rotate-45" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11px] font-medium text-foreground/80 backdrop-blur transition hover:border-primary/50 hover:text-primary"
          aria-label="إعادة تشغيل المحاكي"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          إعادة المعاينة
        </button>
        <span className="text-[11px] text-muted-foreground">
          محاكي واتساب تفاعلي — جرّب الأزرار وأرسل رسالة
        </span>
      </div>

      <style>{`
        .dot-typing {
          display: inline-block;
          width: 6px; height: 6px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.65);
          animation: dotPulse 1s infinite ease-in-out;
        }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Bubble({
  msg,
  onAccept,
  onDecline,
  onLocation,
  rsvp,
}: {
  msg: Msg;
  onAccept: () => void;
  onDecline: () => void;
  onLocation: () => void;
  rsvp: "accepted" | "declined" | null;
}) {
  const isMe = msg.from === "me";
  const align = isMe ? "justify-end" : "justify-start";
  const bubbleColor = isMe ? "bg-[#005c4b]" : "bg-[#202c33]";
  const corner = isMe ? "rounded-tr-sm" : "rounded-tl-sm";

  if (msg.kind === "location") {
    return (
      <div className={`flex ${align}`}>
        <a
          href={msg.locationUrl}
          target="_blank"
          rel="noreferrer noopener"
          className={`block max-w-[86%] overflow-hidden rounded-2xl ${corner} ${bubbleColor} text-[13px] shadow transition hover:brightness-110`}
        >
          <div className="relative h-32 w-full bg-[#0f2a24]">
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  "linear-gradient(120deg, rgba(0,150,120,0.35), rgba(0,80,70,0.35)), radial-gradient(circle at 30% 40%, rgba(255,255,255,0.15), transparent 60%)",
              }}
            />
            <div className="absolute inset-0 grid place-items-center">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-[#005c4b] shadow-lg">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="px-3 py-2">
            <p className="font-semibold text-white">{msg.locationTitle}</p>
            <p className="mt-0.5 text-[11px] text-white/70">اضغط لفتح الموقع في الخرائط</p>
            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/70">
              <span>{msg.time}</span>
              <Check className="h-3 w-3" />
              <Check className="-ms-2 h-3 w-3 text-sky-300" />
            </div>
          </div>
        </a>
      </div>
    );
  }

  return (
    <div className={`flex ${align}`}>
      <div
        className={`relative max-w-[88%] overflow-hidden rounded-2xl ${corner} ${bubbleColor} text-[13px] leading-7 shadow`}
      >
        {msg.imageUrl ? (
          <div className="bg-black/20 p-1">
            <img
              src={msg.imageUrl}
              alt="invitation"
              className="h-40 w-full rounded-xl object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ) : null}
        {!msg.imageUrl && !msg.text ? (
          <div className="m-1 grid h-32 place-items-center rounded-xl bg-black/30 text-white/50">
            <ImageIcon className="h-6 w-6" />
          </div>
        ) : null}
        {msg.text ? (
          <div className="px-3 pt-2">
            <p className="whitespace-pre-wrap break-words text-right">
              <Linkified text={msg.text} />
            </p>
            <div className="mb-1 mt-1 flex items-center justify-end gap-1 text-[10px] text-white/70">
              <span>{msg.time}</span>
              {isMe && (
                <>
                  <Check className="h-3 w-3" />
                  <Check className="-ms-2 h-3 w-3 text-sky-300" />
                </>
              )}
            </div>
          </div>
        ) : null}

        {msg.showButtons ? (
          <div className="mt-1 divide-y divide-white/10 border-t border-white/10 bg-[#014034]">
            <button
              type="button"
              disabled={!!rsvp}
              onClick={onAccept}
              className="flex w-full items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium text-sky-300 transition hover:bg-white/5 active:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {rsvp === "accepted" ? "تم قبول الدعوة" : "قبول الدعوة"}
            </button>
            <button
              type="button"
              disabled={!!rsvp}
              onClick={onDecline}
              className="flex w-full items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium text-sky-300 transition hover:bg-white/5 active:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              {rsvp === "declined" ? "تم الاعتذار" : "الاعتذار عن الدعوة"}
            </button>
            <button
              type="button"
              onClick={onLocation}
              className="flex w-full items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium text-sky-300 transition hover:bg-white/5 active:bg-white/10"
            >
              <MapPin className="h-4 w-4" />
              موقع المناسبة
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}