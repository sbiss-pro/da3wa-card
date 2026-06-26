import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { LogOut, Search, ScanLine, Check, Users, UserCheck, UserX, Clock, AlertTriangle, Wifi, WifiOff, Eye, EyeOff, Ban, X, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { getCoordSession, clearCoordSession, type CoordSession } from "@/lib/coordinator-session";
import { getCoordinatorContext, coordinatorCheckIn, coordinatorCheckInById, coordinatorMarkNoteSeen } from "@/lib/coordinator.functions";
import { RSVP_LABELS, RSVP_COLORS, formatArabicDate } from "@/lib/event-utils";
import { cacheGuests, readCachedGuests, updateCachedGuest, enqueueCheckin, readQueue, clearQueueItem, cacheEvent, readCachedEvent } from "@/lib/coord-offline";

export const Route = createFileRoute("/c/event")({
  ssr: false,
  head: () => ({ meta: [{ title: "لوحة المنسق — دعوتي" }] }),
  component: CoordinatorEvent,
});

type Guest = { id: string; name: string; title?: string | null; phone: string | null; rsvp_status: string; companions_count: number; companion_names?: string[]; attended_count?: number; notes: string | null; notes_seen_at?: string | null; token: string; checked_in_at: string | null };
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
      if (r.event?.id) {
        cacheGuests(r.event.id, list);
        cacheEvent(r.event.id, r.event);
      }
    } catch (e) {
      // Offline / network fallback — use last cached snapshot if available.
      const msg = e instanceof Error ? e.message : "";
      const isAuthError = /جلسة|بيانات الدخول|Unauthorized/i.test(msg);
      try {
        const lastEv = typeof localStorage !== "undefined" ? localStorage.getItem("dawati_coord_last_event") : null;
        if (lastEv && !isAuthError) {
          const cachedEv = readCachedEvent<EventLite>(lastEv);
          const cached = readCachedGuests(lastEv);
          if (cachedEv) {
            setEvent(cachedEv);
            setGuests(cached as Guest[]);
            toast.warning("تعذّر الاتصال بالخادم — يتم عرض النسخة المحفوظة");
            setLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }
      toast.error(msg || "تعذر التحميل");
      if (isAuthError) {
        clearCoordSession();
        navigate({ to: "/c/login" });
      }
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

  const checkInPartial = useCallback(async (g: Guest) => {
    if (!session) return;
    if (g.rsvp_status === "declined" || g.rsvp_status === "attended") return;
    const groupSize = (g.companions_count ?? 0) + 1;
    const raw = window.prompt(`أدخل عدد الحضور الفعلي من المجموعة (الحد الأقصى: ${groupSize})`, String(groupSize));
    if (!raw) return;
    const n = Math.max(1, Math.min(groupSize, parseInt(raw, 10) || groupSize));
    const stamp = new Date().toISOString();
    setGuests(prev => prev.map(x => x.id === g.id ? { ...x, rsvp_status: "attended", checked_in_at: stamp, attended_count: n } : x));
    if (event) updateCachedGuest(event.id, g.id, { rsvp_status: "attended", checked_in_at: stamp });
    try {
      await coordinatorCheckInById({ data: { coordinator_id: session.coordinator_id, session_token: session.session_token, guest_id: g.id, attended_count: n } });
      toast.success(`تم تسجيل ${n} من أصل ${groupSize}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر التسجيل");
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
  if (!session) return null;
  if (!event) {
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center bg-background p-6">
        <div className="max-w-sm text-center space-y-4">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="font-display text-lg font-bold">تعذّر تحميل بيانات الفعالية</h2>
          <p className="text-sm text-muted-foreground">تحقّق من الاتصال بالإنترنت ثم أعد المحاولة، أو سجّل الدخول من جديد.</p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => session && load(session)}>إعادة المحاولة</Button>
            <Button variant="outline" onClick={signOut}>تسجيل خروج</Button>
          </div>
        </div>
      </div>
    );
  }

  const attended = guests.filter(g => g.rsvp_status === "attended").length;
  const accepted = guests.filter(g => g.rsvp_status === "accepted").length;
  const pending = guests.filter(g => g.rsvp_status === "pending").length;
  const declined = guests.filter(g => g.rsvp_status === "declined").length;
  const specialGuests = guests.filter(g => (g.notes || "").trim().length > 0 && !g.notes_seen_at);

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
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button size="sm" variant={g.rsvp_status === "attended" || g.rsvp_status === "declined" ? "outline" : "default"} disabled={g.rsvp_status === "attended" || g.rsvp_status === "declined"} onClick={() => checkInGuest(g)} className={g.rsvp_status === "attended" || g.rsvp_status === "declined" ? "" : "gold-gradient text-primary-foreground"}>
                            <Check className="ms-1 h-3 w-3" /> {g.rsvp_status === "attended" ? `حضر${g.attended_count ? ` (${g.attended_count}/${(g.companions_count ?? 0) + 1})` : ""}` : g.rsvp_status === "declined" ? "معتذر" : "كامل"}
                          </Button>
                          {g.rsvp_status !== "attended" && g.rsvp_status !== "declined" && (g.companions_count ?? 0) > 0 ? (
                            <Button size="sm" variant="outline" onClick={() => checkInPartial(g)} title="دخول مجزأ">
                              <Users className="ms-1 h-3 w-3" /> مجزأ
                            </Button>
                          ) : null}
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
                onCheckIn={(patch) => {
                  setGuests(prev => prev.map(x => x.id === patch.id ? { ...x, ...patch, rsvp_status: "attended" } : x));
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

/** Audio helpers — short alert beeps via Web Audio. */
function playTone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.25) {
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g); g.connect(ctx.destination);
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, duration);
  } catch { /* ignore */ }
}
function beepSuccess() { playTone(880, 140, "sine", 0.22); setTimeout(() => playTone(1320, 160, "sine", 0.22), 150); }
function beepError() {
  playTone(220, 220, "square", 0.32);
  setTimeout(() => playTone(180, 260, "square", 0.32), 240);
  setTimeout(() => playTone(220, 220, "square", 0.32), 520);
}
function vibrate(pattern: number | number[]) {
  try { (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }).vibrate?.(pattern); } catch { /* ignore */ }
}

type ScanReason = "declined" | "full" | "unknown";
/** `remainingCompanions` = companions seats still available (excludes the main guest). */
type PendingScan = { guest: Guest; remainingCompanions: number; mainAlreadyIn: boolean };

function CoordinatorScanner({ session, eventId, guests, onCheckIn }: { session: CoordSession; eventId: string; guests: Guest[]; onCheckIn: (patch: Partial<Guest> & { id: string; name: string }) => void }) {
  const [scanning, setScanning] = useState(false);
  const [last, setLast] = useState<Guest | null>(null);
  const [pending, setPending] = useState<PendingScan | null>(null);
  const [alert, setAlert] = useState<{ reason: ScanReason; message: string } | null>(null);
  const elId = "coord-qr-reader";

  // Pause decoding while a dialog/alert is showing to avoid re-firing.
  const paused = pending != null || alert != null;

  const finalizeCheckIn = useCallback(async (guest: Guest, attended_count: number) => {
    const stamp = guest.checked_in_at ?? new Date().toISOString();
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    if (offline) {
      updateCachedGuest(eventId, guest.id, { rsvp_status: "attended", checked_in_at: stamp });
      enqueueCheckin(eventId, { guest_id: guest.id, guest_token: guest.token, offline_at: stamp });
      const merged = { ...guest, rsvp_status: "attended", checked_in_at: stamp, attended_count } as Guest;
      setLast(merged);
      onCheckIn({ id: guest.id, name: guest.name, rsvp_status: "attended", checked_in_at: stamp, attended_count });
      beepSuccess(); vibrate(80);
      toast.warning(`تم تسجيل ${guest.name} محلياً (ستتم المزامنة)`);
      return;
    }
    try {
      const r = await coordinatorCheckInById({ data: { coordinator_id: session.coordinator_id, session_token: session.session_token, guest_id: guest.id, attended_count } });
      const merged = { ...guest, ...r, rsvp_status: "attended" } as Guest;
      setLast(merged);
      onCheckIn({ id: guest.id, name: guest.name, rsvp_status: "attended", checked_in_at: merged.checked_in_at ?? stamp, attended_count: r.attended_count ?? attended_count });
      beepSuccess(); vibrate(80);
      toast.success(`أهلاً ${guest.name} — تم تسجيل ${r.attended_count ?? attended_count} / ${(guest.companions_count ?? 0) + 1}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذّر التسجيل";
      if (msg.includes("اكتمل")) {
        beepError(); vibrate([200, 80, 200]);
        setAlert({ reason: "full", message: msg });
      } else if (msg.includes("معتذِر")) {
        beepError(); vibrate([200, 80, 200]);
        setAlert({ reason: "declined", message: msg });
      } else {
        updateCachedGuest(eventId, guest.id, { rsvp_status: "attended", checked_in_at: stamp });
        enqueueCheckin(eventId, { guest_id: guest.id, guest_token: guest.token, offline_at: stamp });
        onCheckIn({ id: guest.id, name: guest.name, rsvp_status: "attended", checked_in_at: stamp, attended_count });
        beepSuccess(); vibrate(80);
        toast.warning("تم التسجيل محلياً، ستتم المزامنة لاحقاً");
      }
    }
  }, [eventId, onCheckIn, session]);

  const handleDecoded = useCallback((decoded: string) => {
    if (paused) return;
    const token = decoded.includes("/i/") ? decoded.split("/i/")[1].split(/[?#]/)[0] : decoded.trim();
    if (!token || token.length < 4 || token.length > 128) {
      beepError(); vibrate([200, 80, 200]);
      setAlert({ reason: "unknown", message: "رمز غير صالح — يرجى المحاولة مجدداً" });
      return;
    }
    const guest = guests.find(x => x.token === token);
    if (!guest) {
      beepError(); vibrate([200, 80, 200]);
      setAlert({ reason: "unknown", message: "هذا الرمز غير معروف في هذه الفعالية" });
      return;
    }
    if (guest.rsvp_status === "declined") {
      beepError(); vibrate([200, 80, 200]);
      setLast(guest);
      setAlert({ reason: "declined", message: "هذا المدعو معتذِر — لا يُسمح بتسجيل الحضور" });
      return;
    }
    const companionsCap = guest.companions_count ?? 0;
    const groupSize = companionsCap + 1;
    const already = guest.attended_count ?? (guest.rsvp_status === "attended" ? groupSize : 0);
    const mainAlreadyIn = already >= 1;
    const companionsIn = Math.max(0, already - 1);
    const remainingCompanions = Math.max(0, companionsCap - companionsIn);

    if (guest.rsvp_status === "attended" && already >= groupSize) {
      beepError(); vibrate([200, 80, 200]);
      setLast(guest);
      setAlert({ reason: "full", message: `هذا الكود مستخدم مسبقاً بالكامل! وقت التسجيل: ${guest.checked_in_at ? formatArabicDate(guest.checked_in_at) : "—"}` });
      return;
    }

    // Solo guest (no companions configured) → instant check-in, no dialog.
    if (companionsCap === 0) {
      void finalizeCheckIn(guest, 1);
      return;
    }

    // Companions exist → open smart dialog with remaining seats.
    setPending({ guest, remainingCompanions, mainAlreadyIn });
  }, [guests, paused, finalizeCheckIn]);

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
          (decoded: string) => {
            const now = Date.now();
            if (decoded === lastToken && now - lastAt < 2500) return;
            lastToken = decoded; lastAt = now;
            handleDecoded(decoded);
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
  }, [scanning, handleDecoded]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="p-4">
        <h3 className="mb-3 font-display text-lg font-bold">مسح QR</h3>
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <ScanLine className="mx-auto h-10 w-10 text-gold" />
          <p className="mt-2 text-sm text-muted-foreground">افتح الكاميرا لمسح أكواد المدعوين بسرعة.</p>
          <Button onClick={() => setScanning(true)} className="mt-3 gold-gradient text-primary-foreground">بدء المسح</Button>
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="mb-3 font-display text-lg font-bold">آخر تسجيل</h3>
        {last ? (
          <div className="rounded-xl border border-primary/40 p-4 text-center">
            <p className="font-display text-xl font-bold">{last.title ? `${last.title} ` : ""}{last.name}</p>
            <p className="mt-1 text-sm">المرافقون المسموح بهم: <span className="font-bold text-gold">{last.companions_count}</span></p>
            {last.attended_count != null ? (
              <p className="mt-2 text-xs text-muted-foreground">عدد من دخل من المجموعة: <span className="font-bold text-foreground">{last.attended_count}</span> / {(last.companions_count ?? 0) + 1}</p>
            ) : null}
            {last.companion_names && last.companion_names.length > 0 ? (
              <div className="mt-3 rounded-lg border border-gold/30 bg-gold/5 p-3 text-right text-sm">
                <Label className="text-xs">أسماء المرافقين</Label>
                <ul className="mt-1 space-y-0.5 text-foreground/90">
                  {last.companion_names.map((n, i) => <li key={i}>• {n || "—"}</li>)}
                </ul>
              </div>
            ) : null}
            {last.notes && last.rsvp_status !== "declined" ? (
              <div className="mt-3 rounded-lg bg-muted/40 p-3 text-right text-sm">
                <Label className="text-xs">ملاحظات الضيف (قراءة فقط)</Label>
                <p className="mt-1 whitespace-pre-wrap text-foreground/90">{last.notes}</p>
              </div>
            ) : null}
            {last.rsvp_status === "declined" ? (
              <Badge className="mt-3 bg-rose-600 text-white"><Ban className="ms-1 h-3 w-3" /> معتذِر — لا يُسمح بتسجيل الحضور</Badge>
            ) : null}
          </div>
        ) : <p className="text-sm text-muted-foreground">لم يتم تسجيل أحد بعد</p>}
      </Card>

      {/* Fullscreen camera overlay — centered horizontally + vertically. */}
      {scanning ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" dir="rtl">
          <button type="button" aria-label="إغلاق الكاميرا" onClick={() => setScanning(false)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          <div className="flex w-full max-w-md flex-col items-center gap-3">
            <p className="text-center text-sm text-white/80">ضع الكود داخل الإطار</p>
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-gold/70 shadow-[0_0_60px_rgba(212,175,55,0.25)]">
              <div id={elId} className="absolute inset-0" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-white/20" />
            </div>
            <Button variant="outline" onClick={() => setScanning(false)} className="w-full bg-white/10 text-white hover:bg-white/20">إيقاف الكاميرا</Button>
          </div>
        </div>
      ) : null}

      {/* Companions count dialog — enforces remaining seats. */}
      <CompanionCountDialog
        pending={pending}
        onClose={() => setPending(null)}
        onConfirm={async ({ includeMain, companions }) => {
          if (!pending) return;
          const groupSize = (pending.guest.companions_count ?? 0) + 1;
          const already = pending.guest.attended_count ?? (pending.guest.rsvp_status === "attended" ? groupSize : 0);
          const addingMain = includeMain && !pending.mainAlreadyIn ? 1 : 0;
          const newTotal = Math.min(groupSize, already + addingMain + companions);
          setPending(null);
          await finalizeCheckIn(pending.guest, newTotal);
        }}
      />

      {/* Loud red alert for invalid/used/declined codes. */}
      <Dialog open={alert != null} onOpenChange={(o) => { if (!o) setAlert(null); }}>
        <DialogContent dir="rtl" className="border-rose-500/60 bg-rose-50 text-rose-950 dark:bg-rose-950/40 dark:text-rose-100">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-center text-2xl font-black text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-7 w-7 animate-pulse" /> تنبيه
            </DialogTitle>
            <DialogDescription className="text-center text-base font-semibold text-rose-800 dark:text-rose-200">
              {alert?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border-2 border-rose-500/60 bg-rose-500/10 p-4 text-center text-lg font-black text-rose-700 dark:text-rose-300">
            {alert?.reason === "full" ? "لا يمكن تسجيل الدخول — الكود مستخدم بالكامل" :
              alert?.reason === "declined" ? "مدعو معتذِر — مراجعة المنظم مطلوبة" :
              "رمز غير معروف أو غير فعال"}
          </div>
          <DialogFooter>
            <Button className="w-full bg-rose-600 hover:bg-rose-700" onClick={() => setAlert(null)}>حسناً</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompanionCountDialog({ pending, onClose, onConfirm }: { pending: PendingScan | null; onClose: () => void; onConfirm: (r: { includeMain: boolean; companions: number }) => void | Promise<void> }) {
  const [companions, setCompanions] = useState(0);
  const [includeMain, setIncludeMain] = useState(true);
  useEffect(() => {
    if (pending) {
      setCompanions(pending.remainingCompanions);
      setIncludeMain(!pending.mainAlreadyIn);
    }
  }, [pending]);
  const guest = pending?.guest;
  const remainingCompanions = pending?.remainingCompanions ?? 0;
  const mainAlreadyIn = pending?.mainAlreadyIn ?? false;
  const companionsCap = guest?.companions_count ?? 0;
  const groupSize = companionsCap + 1;
  const already = guest?.attended_count ?? 0;
  const totalNow = (includeMain && !mainAlreadyIn ? 1 : 0) + companions;
  const clamp = (n: number) => Math.max(0, Math.min(remainingCompanions, n));
  const canConfirm = totalNow >= 1 && companions <= remainingCompanions;
  return (
    <Dialog open={pending != null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-xl">تأكيد دخول الضيف</DialogTitle>
          <DialogDescription className="text-center">
            <span className="font-bold text-foreground">{guest?.title ? `${guest.title} ` : ""}{guest?.name}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-muted p-2"><p className="text-muted-foreground">المسموح</p><p className="font-display text-lg font-bold">{groupSize}</p></div>
            <div className="rounded-lg bg-muted p-2"><p className="text-muted-foreground">دخل سابقاً</p><p className="font-display text-lg font-bold">{already}</p></div>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300"><p className="opacity-80">المتبقي للمرافقين</p><p className="font-display text-lg font-bold">{remainingCompanions}</p></div>
          </div>

          {mainAlreadyIn ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
              الضيف الأساسي دخل مسبقاً — هذا تسجيل للمرافقين المتأخرين فقط.
            </div>
          ) : (
            <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm">
              <span className="font-bold">دخول الضيف الأساسي الآن</span>
              <input type="checkbox" checked={includeMain} onChange={(e) => setIncludeMain(e.target.checked)} className="h-5 w-5 accent-[var(--gold,#c9a14a)]" />
            </label>
          )}

          <div>
            <Label className="mb-2 block text-sm">عدد المرافقين الداخلين الآن</Label>
            <div className="flex items-center justify-center gap-3">
              <Button type="button" size="icon" variant="outline" disabled={remainingCompanions === 0} onClick={() => setCompanions((x) => clamp(x - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <div className="grid h-14 w-20 place-items-center rounded-xl border-2 border-primary/40 bg-card font-display text-3xl font-bold">
                {companions}
              </div>
              <Button type="button" size="icon" variant="outline" disabled={companions >= remainingCompanions} onClick={() => setCompanions((x) => clamp(x + 1))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              الحد الأقصى المتاح للمرافقين: <span className="font-bold text-foreground">{remainingCompanions}</span>
            </p>
          </div>

          <div className="rounded-lg bg-primary/5 p-3 text-center text-sm">
            إجمالي الذين سيدخلون الآن: <span className="font-display text-lg font-bold text-primary">{totalNow}</span>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button
            className="gold-gradient text-primary-foreground"
            disabled={!canConfirm}
            onClick={() => onConfirm({ includeMain: includeMain && !mainAlreadyIn, companions })}
          >
            <Check className="ms-1 h-4 w-4" /> تأكيد الدخول
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}