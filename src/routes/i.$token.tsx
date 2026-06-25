import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InvitationCard, type TemplateConfig } from "@/components/invitation-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, Calendar, MapPin, Download, Apple, Clock, Users } from "lucide-react";
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

  return (
    <div dir="rtl" className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <InvitationCard
          config={event.template_config}
          eventName={event.name}
          eventDate={event.event_date}
          location={event.location}
          guestName={guest.title ? `${guest.title} ${guest.name}` : guest.name}
        />

        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">يبدأ خلال</p>
          <p className="mt-2 font-display text-2xl font-bold text-gold">{countdown}</p>
        </Card>

        {guest.companions_count > 0 ? (
          <Card className="flex items-center justify-between gap-3 border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full gold-gradient text-primary-foreground">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">عدد المرافقين المخصّص لك</p>
                <p className="font-display text-lg font-bold">{guest.companions_count}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">من قِبَل المضيف</Badge>
          </Card>
        ) : null}

        {safeHttpUrl(event.location_url) ? (
          <a href={safeHttpUrl(event.location_url)!} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full"><MapPin className="ms-2 h-4 w-4" /> فتح الموقع على الخريطة</Button>
          </a>
        ) : null}

        {!accepted && !declined && !deadlinePassed ? (
          <Card className="p-6">
            <h2 className="mb-4 text-center font-display text-xl font-bold">هل ستشرفنا بالحضور؟</h2>
            <div className="space-y-4">
              {!showDeclineBox ? (
                <>
                  <div>
                    <Label>ملاحظات خاصة (اختياري — احتياجات غذائية، إعاقة…)</Label>
                    <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => respond("accepted")} disabled={submitting} className="gold-gradient text-primary-foreground"><Check className="ms-2 h-4 w-4" /> أقبل الدعوة</Button>
                    <Button onClick={() => setShowDeclineBox(true)} disabled={submitting} variant="outline"><X className="ms-2 h-4 w-4" /> أعتذر</Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 rounded-2xl border border-gold/40 bg-gradient-to-br from-amber-50/60 via-background to-background p-5">
                  <div className="text-center">
                    <p className="font-display text-lg font-bold text-gold">صندوق التبريكات والتهاني</p>
                    <p className="mt-1 text-xs text-muted-foreground">شاركنا كلمة تبريك أو اعتذار رقيق — سيراها أصحاب المناسبة.</p>
                  </div>
                  <Textarea
                    rows={4}
                    value={wishes}
                    onChange={e => setWishes(e.target.value.slice(0, 500))}
                    placeholder="مبارك لكم… دامت الأفراح…"
                    className="bg-card text-right"
                  />
                  <p className="text-left text-[11px] text-muted-foreground">{wishes.length}/500</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="ghost" onClick={() => setShowDeclineBox(false)} disabled={submitting}>رجوع</Button>
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
                    <div className="mx-auto inline-block overflow-hidden rounded-xl">
                      <img src={qr} alt="QR" className="block" />
                    </div>
                    <a href={qr} download={`invite-${guest.name}.png`}><Button variant="outline" size="sm" className="mt-3"><Download className="ms-2 h-4 w-4" /> تحميل الرمز</Button></a>
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