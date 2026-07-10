import { MessageCircle, Phone, Video, ArrowLeft, Check, CheckCircle2, XCircle, MapPin, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export function WhatsAppMobilePreview({
  message,
  senderName = "INVITLY",
  imageUrl,
  showButtons = true,
  inviteUrl,
  locationUrl,
}: {
  message: string;
  senderName?: string;
  imageUrl?: string;
  showButtons?: boolean;
  inviteUrl?: string;
  locationUrl?: string;
}) {
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
              <div className="relative max-w-[88%] overflow-hidden rounded-2xl rounded-tr-sm bg-[#005c4b] text-[13px] leading-7 shadow">
                {imageUrl ? (
                  <div className="bg-black/20 p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="invitation"
                      className="h-40 w-full rounded-xl object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                ) : (
                  <div className="m-1 grid h-40 place-items-center rounded-xl bg-black/30 text-white/50">
                    <div className="flex flex-col items-center gap-1 text-[10px]">
                      <ImageIcon className="h-6 w-6" />
                      <span>صورة الدعوة</span>
                    </div>
                  </div>
                )}
                <div className="px-3 pt-2">
                  <p className="whitespace-pre-wrap break-words text-right">
                    {parts.map((p, i) =>
                      /^https?:\/\//.test(p) ? (
                        <span key={i} className="text-sky-300 underline underline-offset-2">{p}</span>
                      ) : (
                        <span key={i}>{p}</span>
                      ),
                    )}
                  </p>
                  <div className="mb-1 mt-1 flex items-center justify-end gap-1 text-[10px] text-white/70">
                    <span>{time}</span>
                    <Check className="h-3 w-3" />
                    <Check className="-ms-2 h-3 w-3 text-sky-300" />
                  </div>
                </div>
                {showButtons ? (
                  <div className="mt-1 divide-y divide-white/10 border-t border-white/10 bg-[#014034]">
                    <button
                      type="button"
                      onClick={() => {
                        if (inviteUrl) window.open(inviteUrl + "#accept", "_blank", "noopener");
                        else toast.info("سيتم فتح صفحة الدعوة لدى الضيف لتأكيد الحضور");
                      }}
                      className="flex w-full items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium text-sky-300 transition hover:bg-white/5 active:bg-white/10"
                    >
                      <CheckCircle2 className="h-4 w-4" /> قبول الدعوة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (inviteUrl) window.open(inviteUrl + "#decline", "_blank", "noopener");
                        else toast.info("سيتم فتح صفحة الدعوة لدى الضيف للاعتذار");
                      }}
                      className="flex w-full items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium text-sky-300 transition hover:bg-white/5 active:bg-white/10"
                    >
                      <XCircle className="h-4 w-4" /> الاعتذار عن الدعوة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (locationUrl) window.open(locationUrl, "_blank", "noopener");
                        else toast.info("لم يتم تحديد رابط موقع المناسبة بعد — أضِفه من تبويب «تحرير الفعالية»");
                      }}
                      className="flex w-full items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium text-sky-300 transition hover:bg-white/5 active:bg-white/10"
                    >
                      <MapPin className="h-4 w-4" /> موقع المناسبة
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">معاينة تفاعلية لرسالة WhatsApp</p>
    </div>
  );
}