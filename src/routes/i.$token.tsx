import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InvitationCard, type TemplateConfig } from "@/components/invitation-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, Calendar, MapPin, Download, Apple, Wallet, Clock } from "lucide-react";
import { buildCalendarLinks, formatArabicDate, RSVP_LABELS, RSVP_COLORS } from "@/lib/event-utils";
import { toast } from "sonner";
import QRCode from "qrcode";
import { getInvitation, submitRsvp } from "@/lib/invitation.functions";

type LoaderData = {
  guest: { id: string; token: string; name: string; rsvp_status: string; companions_count: number; notes: string | null };
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
  const [companions, setCompanions] = useState(guest.companions_count);
  const [notes, setNotes] = useState(guest.notes || "");
  const [submitting, setSubmitting] = useState(false);
  const [qr, setQr] = useState<string>("");
  const [countdown, setCountdown] = useState("");

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
    }, 1000);
    return () => clearInterval(t);
  }, [event.event_date]);

  const deadlineIso = event.template_config?.rsvp_deadline || null;
  const deadlinePassed = !!deadlineIso && new Date(deadlineIso).getTime() < Date.now();

  const respond = async (status: "accepted" | "declined") => {
    if (deadlinePassed) {
      toast.error("انتهت الفترة المحددة لتأكيد الحضور");
      return;
    }
    setSubmitting(true);
    try {
      const safeCompanions = Math.max(0, Math.min(2, Number.isFinite(companions) ? companions : 0));
      await submitRsvp({ data: { token: guest.token, status, companions: safeCompanions, notes } });
      setGuest(prev => ({ ...prev, rsvp_status: status, companions_count: safeCompanions, notes }));
      toast.success(status === "accepted" ? "شكراً لقبول الدعوة" : "تم تسجيل اعتذارك");
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

  const downloadPass = (wallet: "apple" | "google") => {
    const lines = [
      "DAWATI DIGITAL PASS",
      "===================",
      `Wallet: ${wallet === "apple" ? "Apple Wallet" : "Google Wallet"}`,
      `Event:  ${event.name}`,
      `Date:   ${formatArabicDate(event.event_date)}`,
      `Guest:  ${guest.name}`,
      `Companions: ${guest.companions_count}`,
      `Token:  ${guest.token}`,
      event.location ? `Place:  ${event.location}` : "",
      "",
      "(عرض تجريبي لبطاقة المحفظة الرقمية)",
    ].filter(Boolean).join("\n");
    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dawati-pass-${guest.token}.${wallet === "apple" ? "pkpass.txt" : "gpass.txt"}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(wallet === "apple" ? "تم تجهيز بطاقة Apple Wallet" : "تم تجهيز بطاقة Google Wallet");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <InvitationCard
          config={event.template_config}
          eventName={event.name}
          eventDate={event.event_date}
          location={event.location}
          guestName={guest.name}
        />

        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">يبدأ خلال</p>
          <p className="mt-2 font-display text-2xl font-bold text-gold">{countdown}</p>
        </Card>

        {event.location_url ? (
          <a href={event.location_url} target="_blank" rel="noreferrer">
            <Button variant="outline" className="w-full"><MapPin className="ms-2 h-4 w-4" /> فتح الموقع على الخريطة</Button>
          </a>
        ) : null}

        {!accepted && !declined && !deadlinePassed ? (
          <Card className="p-6">
            <h2 className="mb-4 text-center font-display text-xl font-bold">هل ستشرفنا بالحضور؟</h2>
            <div className="space-y-4">
              <div>
                <Label>عدد المرافقين</Label>
                <Select value={String(companions)} onValueChange={v => setCompanions(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">بدون مرافقين</SelectItem>
                    <SelectItem value="1">مرافق واحد</SelectItem>
                    <SelectItem value="2">مرافقان (الحد الأقصى)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ملاحظات خاصة (احتياجات غذائية، إعاقة...)</Label>
                <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => respond("accepted")} disabled={submitting} className="gold-gradient text-primary-foreground"><Check className="ms-2 h-4 w-4" /> أقبل الدعوة</Button>
                <Button onClick={() => respond("declined")} disabled={submitting} variant="outline"><X className="ms-2 h-4 w-4" /> أعتذر</Button>
              </div>
            </div>
          </Card>
        ) : !accepted && !declined && deadlinePassed ? (
          <Card className="p-6 text-center">
            <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-display text-lg font-bold">نعتذر منك</p>
            <p className="mt-1 text-sm text-muted-foreground">لقد انتهت الفترة المحددة لتأكيد الحضور.</p>
            {deadlineIso ? <p className="mt-2 text-xs text-muted-foreground">المهلة: {formatArabicDate(deadlineIso)}</p> : null}
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <Badge style={{ background: RSVP_COLORS[guest.rsvp_status], color: "#fff" }}>{RSVP_LABELS[guest.rsvp_status]}</Badge>
            <p className="mt-3 text-muted-foreground">{accepted ? "نتشرف بحضورك" : "نشكر تواصلك"}</p>
            {accepted ? (
              <>
                <div className="mt-6 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <a href={cal.google} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full"><Calendar className="ms-2 h-4 w-4" /> Google Calendar</Button></a>
                  <a href={cal.apple} download={`${event.name}.ics`}><Button variant="outline" className="w-full"><Apple className="ms-2 h-4 w-4" /> Apple Calendar</Button></a>
                </div>
                {qr ? (
                  <div className="mt-6">
                    <p className="mb-2 text-sm text-muted-foreground">رمز الدخول الخاص بك</p>
                    <img src={qr} alt="QR" className="mx-auto rounded-xl" />
                    <a href={qr} download={`invite-${guest.name}.png`}><Button variant="outline" size="sm" className="mt-3"><Download className="ms-2 h-4 w-4" /> تحميل الرمز</Button></a>
                    <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2">
                      <Button
                        onClick={() => downloadPass("apple")}
                        className="w-full bg-black text-white hover:bg-black/90"
                      >
                        <Apple className="ms-2 h-4 w-4" /> إضافة إلى محفظة Apple
                      </Button>
                      <Button
                        onClick={() => downloadPass("google")}
                        className="w-full"
                        style={{ background: "#1a73e8", color: "#fff" }}
                      >
                        <Wallet className="ms-2 h-4 w-4" /> إضافة إلى محفظة Google
                      </Button>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">عرض تجريبي — يتم تنزيل ملف بطاقة معاينة.</p>
                  </div>
                ) : null}
              </>
            ) : null}
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">تاريخ الفعالية: {formatArabicDate(event.event_date)}</p>
      </div>
    </div>
  );
}