import { MessageCircle, Phone, Video, ArrowLeft, Check } from "lucide-react";

export function WhatsAppMobilePreview({ message, senderName = "دعوتي" }: { message: string; senderName?: string }) {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  // Linkify URLs so the chat bubble looks real.
  const parts = message.split(/(https?:\/\/\S+)/g);

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[320px]">
      {/* Phone bezel */}
      <div className="relative rounded-[2.4rem] border border-border bg-neutral-900 p-2 shadow-2xl">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-neutral-900" />
        {/* Screen */}
        <div className="overflow-hidden rounded-[2rem] bg-[#0b141a] text-white">
          {/* WA header */}
          <div className="flex items-center justify-between gap-2 bg-[#005c4b] px-3 pb-2 pt-7">
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 opacity-80" />
              <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-[13px] font-semibold">{senderName}</p>
                <p className="text-[10px] opacity-80">متصل الآن</p>
              </div>
            </div>
            <div className="flex items-center gap-3 opacity-80">
              <Video className="h-4 w-4" />
              <Phone className="h-4 w-4" />
            </div>
          </div>

          {/* Chat area */}
          <div
            className="min-h-[360px] space-y-2 p-3"
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

            {/* Outgoing bubble */}
            <div className="flex justify-end">
              <div className="relative max-w-[85%] rounded-2xl rounded-tr-sm bg-[#005c4b] px-3 py-2 text-[13px] leading-7 shadow">
                <p className="whitespace-pre-wrap break-words text-right">
                  {parts.map((p, i) =>
                    /^https?:\/\//.test(p) ? (
                      <span key={i} className="text-sky-300 underline underline-offset-2">{p}</span>
                    ) : (
                      <span key={i}>{p}</span>
                    ),
                  )}
                </p>
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/70">
                  <span>{time}</span>
                  <Check className="h-3 w-3" />
                  <Check className="-ms-2 h-3 w-3 text-sky-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">معاينة تفاعلية لرسالة WhatsApp</p>
    </div>
  );
}