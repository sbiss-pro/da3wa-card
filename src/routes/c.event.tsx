import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LogOut, Search, ScanLine, Check, Pencil, Users, UserCheck, UserX, Clock } from "lucide-react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { getCoordSession, clearCoordSession, type CoordSession } from "@/lib/coordinator-session";
import { getCoordinatorContext, coordinatorCheckIn, coordinatorCheckInById, coordinatorUpdateGuest } from "@/lib/coordinator.functions";
import { RSVP_LABELS, RSVP_COLORS, formatArabicDate } from "@/lib/event-utils";

export const Route = createFileRoute("/c/event")({
  ssr: false,
  head: () => ({ meta: [{ title: "لوحة المنسق — دعوتي" }] }),
  component: CoordinatorEvent,
});

type Guest = { id: string; name: string; phone: string | null; rsvp_status: string; companions_count: number; notes: string | null; token: string; checked_in_at: string | null };
type EventLite = { id: string; name: string; event_type: string; event_date: string; location: string | null };

function CoordinatorEvent() {
  const navigate = useNavigate();
  const [session, setSession] = useState<CoordSession | null>(null);
  const [event, setEvent] = useState<EventLite | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const signOut = useCallback(() => {
    clearCoordSession();
    navigate({ to: "/c/login" });
  }, [navigate]);

  const load = useCallback(async (s: CoordSession) => {
    try {
      const r = await getCoordinatorContext({ data: { coordinator_id: s.coordinator_id, session_token: s.session_token } });
      setEvent(r.event as EventLite);
      setGuests((r.guests || []) as Guest[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر التحميل");
      clearCoordSession();
      navigate({ to: "/c/login" });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const s = getCoordSession();
    if (!s) { navigate({ to: "/c/login" }); return; }
    setSession(s);
    load(s);
  }, [load, navigate]);

  const filtered = useMemo(
    () => guests.filter(g => g.name.toLowerCase().includes(q.toLowerCase()) || (g.phone || "").includes(q)),
    [guests, q],
  );

  const checkInGuest = useCallback(async (g: Guest) => {
    if (!session) return;
    if (g.rsvp_status === "attended") {
      const when = g.checked_in_at ? formatArabicDate(g.checked_in_at) : "—";
      toast.warning(`هذا الرمز تم استخدامه بالفعل! وقت التسجيل: ${when}`);
      return;
    }
    try {
      await coordinatorCheckInById({ data: { coordinator_id: session.coordinator_id, session_token: session.session_token, guest_id: g.id } });
      setGuests(prev => prev.map(x => x.id === g.id ? { ...x, rsvp_status: "attended", checked_in_at: new Date().toISOString() } : x));
      toast.success(`تم تسجيل حضور ${g.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر التسجيل");
    }
  }, [session]);

  const [editing, setEditing] = useState<Guest | null>(null);
  const changeStatus = useCallback(async (g: Guest, status: string) => {
    if (!session) return;
    try {
      const u = await coordinatorUpdateGuest({ data: { coordinator_id: session.coordinator_id, session_token: session.session_token, guest_id: g.id, rsvp_status: status as "pending" | "accepted" | "declined" | "attended" } });
      setGuests(prev => prev.map(x => x.id === g.id ? { ...x, ...u } as Guest : x));
      toast.success("تم تحديث الحالة");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر التحديث");
    }
  }, [session]);

  const saveNotes = useCallback(async (g: Guest, notes: string) => {
    if (!session) return;
    try {
      const u = await coordinatorUpdateGuest({ data: { coordinator_id: session.coordinator_id, session_token: session.session_token, guest_id: g.id, notes: notes || null } });
      setGuests(prev => prev.map(x => x.id === g.id ? { ...x, ...u } as Guest : x));
      toast.success("تم حفظ الملاحظات");
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر الحفظ");
    }
  }, [session]);

  if (loading) return <div dir="rtl" className="p-8 text-muted-foreground">جاري التحميل...</div>;
  if (!session || !event) return null;

  const attended = guests.filter(g => g.rsvp_status === "attended").length;
  const accepted = guests.filter(g => g.rsvp_status === "accepted").length;
  const pending = guests.filter(g => g.rsvp_status === "pending").length;
  const declined = guests.filter(g => g.rsvp_status === "declined").length;

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full gold-gradient text-primary-foreground font-bold">د</span>
            <span className="font-display text-lg font-bold">منسق · {session.name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="ms-1 h-4 w-4" /> خروج</Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">{event.name}</h1>
          <p className="text-sm text-muted-foreground">{formatArabicDate(event.event_date)}{event.location ? ` · ${event.location}` : ""}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard icon={UserCheck} label="حضروا" value={attended} color="bg-emerald-500" />
            <StatCard icon={Users} label="إجمالي" value={guests.length} color="bg-primary" />
            <StatCard icon={Check} label="مقبولون" value={accepted} color="bg-blue-500" />
            <StatCard icon={Clock} label="لم يردوا" value={pending} color="bg-amber-500" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">معتذرون: {declined}</p>
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">قائمة المدعوين</TabsTrigger>
            <TabsTrigger value="scan">مسح QR</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." className="pe-9" />
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المرافقون</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">لا يوجد نتائج</TableCell></TableRow>
                  ) : filtered.map(g => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell>
                        <Select value={g.rsvp_status} onValueChange={(v) => changeStatus(g, v)}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">لم يرد</SelectItem>
                            <SelectItem value="accepted">مقبول</SelectItem>
                            <SelectItem value="declined">اعتذر</SelectItem>
                            <SelectItem value="attended">حضر</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">{g.companions_count}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">{g.notes || "—"}</TableCell>
                      <TableCell className="text-left">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(g)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant={g.rsvp_status === "attended" ? "outline" : "default"} disabled={g.rsvp_status === "attended"} onClick={() => checkInGuest(g)} className={g.rsvp_status === "attended" ? "" : "gold-gradient text-primary-foreground"}>
                            <Check className="ms-1 h-3 w-3" /> {g.rsvp_status === "attended" ? "حضر" : "تسجيل"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          <TabsContent value="scan" className="mt-4">
            <ErrorBoundary title="تعذّر تشغيل ماسح QR">
              <CoordinatorScanner
                session={session}
                guests={guests}
                onCheckIn={(g) => {
                  setGuests(prev => prev.map(x => x.id === g.id ? { ...x, rsvp_status: "attended", checked_in_at: new Date().toISOString() } : x));
                }}
                onSaveNotes={saveNotes}
              />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>
      <EditGuestDialog guest={editing} onClose={() => setEditing(null)} onSave={saveNotes} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: number; color: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${color} text-white`}><Icon className="h-4 w-4" /></div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function EditGuestDialog({ guest, onClose, onSave }: { guest: Guest | null; onClose: () => void; onSave: (g: Guest, notes: string) => void }) {
  const [notes, setNotes] = useState("");
  useEffect(() => { if (guest) setNotes(guest.notes || ""); }, [guest]);
  return (
    <Dialog open={!!guest} onOpenChange={v => !v && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>تعديل ملاحظات: {guest?.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Label>ملاحظات الضيف</Label>
          <Textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="احتياجات خاصة، طلبات، ملاحظات..." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button className="gold-gradient text-primary-foreground" onClick={() => guest && onSave(guest, notes)}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CoordinatorScanner({ session, guests, onCheckIn, onSaveNotes }: { session: CoordSession; guests: Guest[]; onCheckIn: (g: { id: string; name: string }) => void; onSaveNotes: (g: Guest, notes: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [last, setLast] = useState<Guest | null>(null);
  const [notes, setNotes] = useState("");
  const elId = "coord-qr-reader";

  useEffect(() => {
    if (!scanning) return;
    let stopped = false;
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let lastToken = "";
    let lastAt = 0;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (stopped) return;
        const s = new Html5Qrcode(elId);
        scanner = s as unknown as { stop: () => Promise<void>; clear: () => void };
        await s.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decoded: string) => {
            try {
              const token = decoded.includes("/i/") ? decoded.split("/i/")[1].split(/[?#]/)[0] : decoded.trim();
              if (!token || token.length < 4 || token.length > 128) { toast.error("رمز غير صالح"); return; }
              const now = Date.now();
              if (token === lastToken && now - lastAt < 2500) return;
              lastToken = token; lastAt = now;
              try {
                const r = await coordinatorCheckIn({ data: { coordinator_id: session.coordinator_id, session_token: session.session_token, guest_token: token } });
                const g = guests.find(x => x.token === token);
                const merged = { ...(g || {} as Guest), ...r, rsvp_status: "attended" } as Guest;
                setLast(merged);
                setNotes(merged.notes || "");
                toast.success(`أهلاً ${r.name}`);
                onCheckIn({ id: r.id, name: r.name });
              } catch (err) {
                const msg = err instanceof Error ? err.message : "تعذّر التسجيل";
                if (msg.includes("بالفعل")) {
                  const g = guests.find(x => x.token === token);
                  if (g) { setLast(g); setNotes(g.notes || ""); }
                  toast.warning(msg);
                } else {
                  toast.error(msg);
                }
              }
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "تعذّر التسجيل");
            }
          },
          () => {},
        );
      } catch (e) {
        console.error(e);
        toast.error("تعذّر فتح الكاميرا — تأكد من السماح بالوصول");
        setScanning(false);
      }
    })();
    return () => {
      stopped = true;
      scanner?.stop().then(() => scanner?.clear()).catch(() => {});
    };
  }, [scanning, session, onCheckIn, guests]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="p-4">
        <h3 className="mb-3 font-display text-lg font-bold">مسح QR</h3>
        {!scanning ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <ScanLine className="mx-auto h-10 w-10 text-gold" />
            <Button onClick={() => setScanning(true)} className="mt-3 gold-gradient text-primary-foreground">بدء المسح</Button>
          </div>
        ) : (
          <>
            <div id={elId} className="overflow-hidden rounded-xl" />
            <Button variant="outline" onClick={() => setScanning(false)} className="mt-3 w-full">إيقاف</Button>
          </>
        )}
      </Card>
      <Card className="p-4">
        <h3 className="mb-3 font-display text-lg font-bold">آخر تسجيل</h3>
        {last ? (
          <div className="rounded-xl border border-primary/40 p-4 text-center">
            <p className="font-display text-xl font-bold">{last.name}</p>
            <p className="mt-1 text-sm">المرافقون: <span className="font-bold text-gold">{last.companions_count}</span></p>
            <div className="mt-3 text-right">
              <Label className="text-xs">ملاحظات الضيف</Label>
              <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
              <Button size="sm" className="mt-2 w-full" variant="outline" onClick={() => onSaveNotes(last, notes)}>حفظ الملاحظات</Button>
            </div>
          </div>
        ) : <p className="text-sm text-muted-foreground">لم يتم تسجيل أحد بعد</p>}
      </Card>
    </div>
  );
}