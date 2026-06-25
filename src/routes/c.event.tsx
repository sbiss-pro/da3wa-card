import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LogOut, Search, ScanLine, Check, Users, UserCheck, UserX, Clock, AlertTriangle, Wifi, WifiOff, Eye, EyeOff, Ban } from "lucide-react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { getCoordSession, clearCoordSession, type CoordSession } from "@/lib/coordinator-session";
import { getCoordinatorContext, coordinatorCheckIn, coordinatorCheckInById, coordinatorMarkNoteSeen } from "@/lib/coordinator.functions";
import { RSVP_LABELS, RSVP_COLORS, formatArabicDate } from "@/lib/event-utils";
import { cacheGuests, readCachedGuests, updateCachedGuest, enqueueCheckin, readQueue, clearQueueItem } from "@/lib/coord-offline";

export const Route = createFileRoute("/c/event")({
  ssr: false,
  head: () => ({ meta: [{ title: "لوحة المنسق — دعوتي" }] }),
  component: CoordinatorEvent,
});

type Guest = { id: string; name: string; title?: string | null; phone: string | null; rsvp_status: string; companions_count: number; notes: string | null; notes_seen_at?: string | null; token: string; checked_in_at: string | null };
type EventLite = { id: string; name: string; event_type: string; event_date: string; location: string | null };

function CoordinatorEvent() {
  const navigate = useNavigate();
  const [session, setSession] = useState<CoordSession | null>(null);
  const [event, setEvent] = useState<EventLite | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean>(typeof navigator === "undefined" ? true : navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const signOut = useCallback(() => {
    clearCoordSession();
    navigate({ to: "/c/login" });
  }, [navigate]);

  const load = useCallback(async (s: CoordSession) => {
    try {
      const r = await getCoordinatorContext({ data: { coordinator_id: s.coordinator_id, session_token: s.session_token } });
      setEvent(r.event as EventLite);
      const list = (r.guests || []) as Guest[];
      setGuests(list);
      if (r.event?.id) cacheGuests(r.event.id, list);
    } catch (e) {
      // Offline fallback — use last cached snapshot if available.
      try {
        const lastEv = localStorage.getItem("dawati_coord_last_event");
        if (lastEv) {
          const cached = readCachedGuests(lastEv);
          if (cached.length) {
            setGuests(cached as Guest[]);
            toast.warning("أنت في وضع عدم الاتصال — يتم استخدام النسخة المحفوظة");
            setLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }
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

  useEffect(() => {
    if (event?.id) { try { localStorage.setItem("dawati_coord_last_event", event.id); } catch { /* ignore */ } }
  }, [event?.id]);

  useEffect(() => {
    if (!session || !event) return;
    const refreshPending = () => setPendingCount(readQueue(event.id).length);
    refreshPending();
    const flush = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      const queue = readQueue(event.id);
      if (!queue.length) return;
      for (const item of queue) {
        try {
          await coordinatorCheckIn({ data: { coordinator_id: session.coordinator_id, session_token: session.session_token, guest_token: item.guest_token } });
        } catch { /* ignore individual failures */ }
        clearQueueItem(event.id, item.guest_token);
      }
      refreshPending();
      toast.success("تمت مزامنة عمليات التسجيل المؤجلة");
      load(session);
    };
    const onOnline = () => { setOnline(true); void flush(); };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    void flush();
    const t = setInterval(refreshPending, 5000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(t);
    };
  }, [session, event, load]);

  const filtered = useMemo(
    () => guests.filter(g =>
      (g.name.toLowerCase().includes(q.toLowerCase()) || (g.phone || "").includes(q)) &&
      (!statusFilter || g.rsvp_status === statusFilter),
    ),
    [guests, q, statusFilter],
  );

  const checkInGuest = useCallback(async (g: Guest) => {
    if (!session) return;
    if (g.rsvp_status === "declined") {
      toast.error("لا يمكن تسجيل حضور مدعو معتذِر — يرجى مراجعة المضيف");
      return;
    }
    if (g.rsvp_status === "attended") {
      const when = g.checked_in_at ? formatArabicDate(g.checked_in_at) : "—";
      toast.warning(`هذا الرمز تم استخدامه بالفعل! وقت التسجيل: ${when}`);
      return;
    }
    const stamp = new Date().toISOString();
    setGuests(prev => prev.map(x => x.id === g.id ? { ...x, rsvp_status: "attended", checked_in_at: stamp } : x));
    if (event) updateCachedGuest(event.id, g.id, { rsvp_status: "attended", checked_in_at: stamp });
    try {
      await coordinatorCheckInById({ data: { coordinator_id: session.coordinator_id, session_token: session.session_token, guest_id: g.id } });
      toast.success(`تم تسجيل حضور ${g.name}`);
    } catch {
      if (event) {
        enqueueCheckin(event.id, { guest_id: g.id, guest_token: g.token, offline_at: stamp });
        setPendingCount(c => c + 1);
      }
      toast.warning(`تم تسجيل ${g.name} محلياً، ستتم المزامنة عند عودة الاتصال`);
    }
  }, [session, event]);

  const toggleNoteSeen = useCallback(async (g: Guest) => {
    if (!session) return;
    const next = !g.notes_seen_at;
    try {
      const u = await coordinatorMarkNoteSeen({ data: { coordinator_id: session.coordinator_id, session_token: session.session_token, guest_id: g.id, seen: next } });
      setGuests(prev => prev.map(x => x.id === g.id ? { ...x, ...u } as Guest : x));
      toast.success(next ? "تم تعليم الملاحظة كمطّلع عليها" : "أُلغي تعليم الملاحظة");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر التحديث");
    }
  }, [session]);

  if (loading) return <div dir="rtl" className="p-8 text-muted-foreground">جاري التحميل...</div>;
  if (!session || !event) return null;

  const attended = guests.filter(g => g.rsvp_status === "attended").length;
  const accepted = guests.filter(g => g.rsvp_status === "accepted").length;
  const pending = guests.filter(g => g.rsvp_status === "pending").length;
  const declined = guests.filter(g => g.rsvp_status === "declined").length;
  const specialGuests = guests.filter(g => (g.notes || "").trim().length > 0);

  const toggleFilter = (s: string) => setStatusFilter(prev => prev === s ? null : s);

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full gold-gradient text-primary-foreground font-bold">د</span>
            <span className="font-display text-lg font-bold">منسق · {session.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${online ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"}`}>
              {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {online ? "متصل" : "غير متصل"}
              {pendingCount > 0 ? ` · ${pendingCount} بانتظار المزامنة` : ""}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="ms-1 h-4 w-4" /> خروج</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">{event.name}</h1>
          <p className="text-sm text-muted-foreground">{formatArabicDate(event.event_date)}{event.location ? ` · ${event.location}` : ""}</p>
          {specialGuests.length > 0 ? (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm">
                <p className="font-bold">تنبيه: لديك {specialGuests.length} ضيف بملاحظات خاصة</p>
                <p className="opacity-80">يرجى مراجعة الملاحظات (احتياجات خاصة، طلبات غذائية، وصول كرسي متحرك…) قبل وأثناء استقبال الضيوف.</p>
              </div>
            </div>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard icon={UserCheck} label="حضروا" value={attended} color="bg-emerald-500" active={statusFilter === "attended"} onClick={() => toggleFilter("attended")} />
            <StatCard icon={Check} label="مقبولون" value={accepted} color="bg-blue-500" active={statusFilter === "accepted"} onClick={() => toggleFilter("accepted")} />
            <StatCard icon={UserX} label="معتذرون" value={declined} color="bg-rose-500" active={statusFilter === "declined"} onClick={() => toggleFilter("declined")} />
            <StatCard icon={Clock} label="لم يردوا" value={pending} color="bg-amber-500" active={statusFilter === "pending"} onClick={() => toggleFilter("pending")} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">إجمالي: {guests.length}{statusFilter ? ` · مرشّح: ${RSVP_LABELS[statusFilter]}` : ""}{statusFilter ? ` · `: ""}{statusFilter ? <button onClick={() => setStatusFilter(null)} className="underline">إزالة الفلتر</button> : null}</p>
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
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-2">
                          {g.notes && !g.notes_seen_at ? (
                            <span className="relative inline-flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                            </span>
                          ) : null}
                          {g.title ? <span className="text-muted-foreground">{g.title}</span> : null}
                          <span>{g.name}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge style={{ background: RSVP_COLORS[g.rsvp_status], color: "#fff" }}>{RSVP_LABELS[g.rsvp_status]}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{g.companions_count}</TableCell>
                      <TableCell className="max-w-[180px] text-sm text-muted-foreground">
                        {g.notes ? (
                          <div className="flex items-center gap-2">
                            <span className="truncate">{g.notes}</span>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => toggleNoteSeen(g)} title={g.notes_seen_at ? "تم الاطلاع" : "تم الاطلاع؟"}>
                              {g.notes_seen_at ? <Eye className="h-3 w-3 text-emerald-600" /> : <EyeOff className="h-3 w-3" />}
                            </Button>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant={g.rsvp_status === "attended" || g.rsvp_status === "declined" ? "outline" : "default"} disabled={g.rsvp_status === "attended" || g.rsvp_status === "declined"} onClick={() => checkInGuest(g)} className={g.rsvp_status === "attended" || g.rsvp_status === "declined" ? "" : "gold-gradient text-primary-foreground"}>
                            <Check className="ms-1 h-3 w-3" /> {g.rsvp_status === "attended" ? "حضر" : g.rsvp_status === "declined" ? "معتذر" : "تسجيل"}
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
                eventId={event.id}
                guests={guests}
                onCheckIn={(g) => {
                  setGuests(prev => prev.map(x => x.id === g.id ? { ...x, rsvp_status: "attended", checked_in_at: new Date().toISOString() } : x));
                }}
              />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, active, onClick }: { icon: typeof Users; label: string; value: number; color: string; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`text-right transition ${onClick ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"}`}>
      <Card className={`p-3 ${active ? "ring-2 ring-primary border-primary" : ""}`}>
        <div className="flex items-center gap-3">
          <div className={`grid h-9 w-9 place-items-center rounded-lg ${color} text-white`}><Icon className="h-4 w-4" /></div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-display text-xl font-bold">{value}</p>
          </div>
        </div>
      </Card>
    </button>
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

function CoordinatorScanner({ session, eventId, guests, onCheckIn, onSaveNotes }: { session: CoordSession; eventId: string; guests: Guest[]; onCheckIn: (g: { id: string; name: string }) => void; onSaveNotes: (g: Guest, notes: string) => void }) {
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
              // Offline-first: validate locally before hitting network.
              const localGuest = guests.find(x => x.token === token);
              if (!localGuest) {
                toast.error("الرمز غير معروف في هذه الفعالية");
                return;
              }
              if (localGuest.rsvp_status === "attended") {
                setLast(localGuest); setNotes(localGuest.notes || "");
                toast.warning(`هذا الرمز تم استخدامه بالفعل! ${localGuest.checked_in_at ? "وقت التسجيل: " + formatArabicDate(localGuest.checked_in_at) : ""}`);
                return;
              }
              const offline = typeof navigator !== "undefined" && !navigator.onLine;
              if (offline) {
                const stamp = new Date().toISOString();
                const merged = { ...localGuest, rsvp_status: "attended", checked_in_at: stamp };
                setLast(merged); setNotes(merged.notes || "");
                updateCachedGuest(eventId, localGuest.id, { rsvp_status: "attended", checked_in_at: stamp });
                enqueueCheckin(eventId, { guest_id: localGuest.id, guest_token: token, offline_at: stamp });
                onCheckIn({ id: localGuest.id, name: localGuest.name });
                toast.warning(`تم تسجيل ${localGuest.name} محلياً (سيتم المزامنة لاحقاً)`);
                return;
              }
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
                  // network blip → queue and update cache locally
                  const stamp = new Date().toISOString();
                  updateCachedGuest(eventId, localGuest.id, { rsvp_status: "attended", checked_in_at: stamp });
                  enqueueCheckin(eventId, { guest_id: localGuest.id, guest_token: token, offline_at: stamp });
                  onCheckIn({ id: localGuest.id, name: localGuest.name });
                  toast.warning(`تم التسجيل محلياً، سيتم المزامنة لاحقاً`);
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
  }, [scanning, session, onCheckIn, guests, eventId]);

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