import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { LogOut, Search, ScanLine, Check, Users, UserCheck, UserX, Clock, AlertTriangle, Wifi, WifiOff, Eye, EyeOff, Ban, Plus, Minus, XCircle } from "lucide-react";
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

type Guest = { id: string; name: string; title?: string | null; phone: string | null; rsvp_status: string; companions_count: number; companion_names?: string[]; attended_count?: number | null; notes: string | null; notes_seen_at?: string | null; token: string; checked_in_at: string | null };
type EventLite = { id: string; name: string; event_type: string; event_date: string; location: string | null };

/* ---- Audio feedback (WebAudio — no asset needed) ---- */
function useBeeper() {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = () => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      try {
        const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
        ctxRef.current = new AC();
      } catch { return null; }
    }
    return ctxRef.current;
  };
  const beep = useCallback((kind: "ok" | "warn" | "error") => {
    const ctx = getCtx(); if (!ctx) return;
    try { if (ctx.state === "suspended") void ctx.resume(); } catch { /* ignore */ }
    const now = ctx.currentTime;
    const seq = kind === "ok" ? [[880, 0.08], [1320, 0.10]]
      : kind === "warn" ? [[520, 0.12], [400, 0.14]]
      : [[220, 0.18], [180, 0.22], [140, 0.28]];
    let t = now;
    for (const [freq, dur] of seq) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kind === "error" ? "square" : "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t); osc.stop(t + dur + 0.02);
      t += dur + 0.04;
    }
  }, []);
  return beep;
}

/* ---- Admission Dialog (replaces window.prompt) ---- */
type AdmitState = { guest: Guest; remaining: number; firstScan: boolean } | null;
function AdmitDialog({ state, onClose, onConfirm }: { state: AdmitState; onClose: () => void; onConfirm: (companionsNow: number) => Promise<void> }) {
  const [companions, setCompanions] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (state) {
      // default: admit everyone remaining (companions only on first scan = remaining-1, else = remaining)
      const def = state.firstScan ? Math.max(0, state.remaining - 1) : state.remaining;
      setCompanions(def);
    }
  }, [state]);
  if (!state) return null;
  const maxCompanions = state.firstScan ? Math.max(0, state.remaining - 1) : state.remaining;
  const total = (state.firstScan ? 1 : 0) + companions;
  const groupSize = state.guest.companions_count + 1;
  const alreadyIn = state.guest.attended_count ?? 0;
  return (
    <Dialog open={!!state} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{state.guest.title ? `${state.guest.title} ` : ""}{state.guest.name}</DialogTitle>
          <DialogDescription>
            حجم المجموعة: <b className="text-foreground">{groupSize}</b>
            {" · "}دخلوا سابقاً: <b className="text-foreground">{alreadyIn}</b>
            {" · "}المتبقي: <b className="text-emerald-600">{state.remaining}</b>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {state.firstScan ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>سيتم تسجيل دخول الضيف الأساسي تلقائياً</span>
            </div>
          ) : (
            <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-3 text-sm">
              الضيف الأساسي مسجّل بالفعل — اختر عدد المرافقين الجدد فقط.
            </div>
          )}
          <div>
            <Label className="mb-2 block">عدد المرافقين الداخلين الآن (الحد: {maxCompanions})</Label>
            <div className="flex items-center justify-center gap-3">
              <Button type="button" size="icon" variant="outline" onClick={() => setCompanions(c => Math.max(0, c - 1))} disabled={companions <= 0}>
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number" inputMode="numeric" min={0} max={maxCompanions}
                value={companions}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isNaN(v)) { setCompanions(0); return; }
                  setCompanions(Math.max(0, Math.min(maxCompanions, v)));
                }}
                className="h-12 w-20 text-center text-xl font-bold tabular-nums"
              />
              <Button type="button" size="icon" variant="outline" onClick={() => setCompanions(c => Math.min(maxCompanions, c + 1))} disabled={companions >= maxCompanions}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              سيتم تسجيل دخول <b className="text-foreground">{total}</b> شخص في هذا المسح
              {total < state.remaining ? " · سيبقى الكود فعّالاً للمرافقين المتأخرين" : " · سيُقفل الكود بعد هذا التسجيل"}
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={busy}>إلغاء</Button>
          <Button
            className="gold-gradient text-primary-foreground"
            disabled={busy || total < 1}
            onClick={async () => {
              setBusy(true);
              try { await onConfirm(companions); } finally { setBusy(false); }
            }}
          >
            <Check className="ms-1 h-4 w-4" /> تأكيد دخول {total}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---- Loud "invalid code" alert dialog ---- */
function InvalidCodeDialog({ message, onClose }: { message: string | null; onClose: () => void }) {
  return (
    <Dialog open={!!message} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-md border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold text-rose-700 dark:text-rose-300">
            <XCircle className="h-7 w-7 animate-pulse" /> تنبيه!
          </DialogTitle>
        </DialogHeader>
        <p className="rounded-lg bg-rose-100 p-4 text-center text-lg font-bold leading-relaxed text-rose-800 dark:bg-rose-900/40 dark:text-rose-100">
          {message}
        </p>
        <DialogFooter>
          <Button className="w-full bg-rose-600 hover:bg-rose-700" onClick={onClose}>تم</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  const [admitState, setAdmitState] = useState<AdmitState>(null);
  const [invalidMsg, setInvalidMsg] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<Guest | null>(null);
  const beep = useBeeper();

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
    // Periodic resync with the host's dashboard so status changes
    // (e.g. host moves a guest back from "attended" to "accepted")
    // unlock the action button on the coordinator side automatically.
    const sync = setInterval(() => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      void load(session);
    }, 20000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(t);
      clearInterval(sync);
    };
  }, [session, event, load]);

  const filtered = useMemo(
    () => guests.filter(g =>
      (g.name.toLowerCase().includes(q.toLowerCase()) || (g.phone || "").includes(q)) &&
      (!statusFilter || g.rsvp_status === statusFilter),
    ),
    [guests, q, statusFilter],
  );

  /**
   * Smart admission router. Validates the guest locally, plays audio feedback,
   * then either admits instantly (no companions) or opens the partial dialog.
   */
  const admitGuest = useCallback(async (g: Guest, companionsNow: number, opts?: { silent?: boolean }) => {
    if (!session) return;
    const groupSize = (g.companions_count ?? 0) + 1;
    const current = g.attended_count ?? 0;
    const firstScan = current === 0;
    const admit = (firstScan ? 1 : 0) + Math.max(0, companionsNow);
    const total = Math.min(groupSize, current + admit);
    const stamp = new Date().toISOString();
    // Optimistic local update
    const merged: Guest = { ...g, rsvp_status: "attended", checked_in_at: firstScan ? stamp : g.checked_in_at, attended_count: total };
    setGuests(prev => prev.map(x => x.id === g.id ? merged : x));
    if (event) updateCachedGuest(event.id, g.id, { rsvp_status: "attended", checked_in_at: merged.checked_in_at ?? stamp });
    setLastScan(merged);
    try {
      const r = await coordinatorCheckInById({ data: { coordinator_id: session.coordinator_id, session_token: session.session_token, guest_id: g.id, companions_now: companionsNow } });
      setGuests(prev => prev.map(x => x.id === g.id ? { ...x, ...r } as Guest : x));
      setLastScan({ ...merged, ...r } as Guest);
      if (!opts?.silent) {
        beep("ok");
        const remaining = groupSize - (r.attended_count ?? total);
        toast.success(remaining > 0 ? `تم تسجيل ${admit} · المتبقي ${remaining}` : `تم تسجيل ${admit} — مكتمل`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "تعذّر التسجيل";
      // Network blip → queue for later sync (cache already updated).
      if (event) {
        enqueueCheckin(event.id, { guest_id: g.id, guest_token: g.token, offline_at: stamp });
        setPendingCount(c => c + 1);
      }
      if (/بالكامل|بالفعل|معتذِر/.test(msg)) {
        beep("error");
        setInvalidMsg(msg);
        // revert local
        setGuests(prev => prev.map(x => x.id === g.id ? g : x));
      } else {
        beep("warn");
        toast.warning(`تم التسجيل محلياً، ستتم المزامنة لاحقاً`);
      }
    }
  }, [session, event, beep]);

  /**
   * Entry point for any check-in trigger (QR scan or list button). Handles the
   * three branches: invalid → loud alert, no-companions → instant, otherwise
   * → open the partial admission dialog.
   */
  const handleScan = useCallback((g: Guest) => {
    const groupSize = (g.companions_count ?? 0) + 1;
    const current = g.attended_count ?? 0;
    if (g.rsvp_status === "declined") {
      beep("error");
      setInvalidMsg(`تنبيه: هذا المدعو معتذر! (${g.name}) — لا يمكن تسجيل حضوره`);
      return;
    }
    if (current >= groupSize) {
      beep("error");
      const when = g.checked_in_at ? formatArabicDate(g.checked_in_at) : "—";
      setInvalidMsg(`تنبيه: هذا الكود مستخدم بالكامل!\n${g.name} — وقت أول تسجيل: ${when}`);
      setLastScan(g);
      return;
    }
    if (groupSize === 1) {
      // No companions — instant admit, no popup.
      void admitGuest(g, 0);
      return;
    }
    const remaining = groupSize - current;
    setAdmitState({ guest: g, remaining, firstScan: current === 0 });
  }, [admitGuest, beep]);

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
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:flex sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full gold-gradient font-display font-extrabold">د</span>
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.3em] text-primary/80">COMMAND CENTER</p>
              <p className="truncate font-display text-base font-bold leading-tight">المنسق · {session.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold backdrop-blur ${
                online
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                  : "border-rose-400/50 bg-rose-500/10 text-rose-300"
              }`}
              title={online ? "متصل بالخادم — مزامنة لحظية" : "وضع أوفلاين — يُسجَّل محلياً"}
            >
              {online ? (
                <>
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <Wifi className="h-3.5 w-3.5" />
                  <span>متصل · مزامنة لحظية</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>أوفلاين</span>
                </>
              )}
              {pendingCount > 0 ? (
                <span className="ms-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                  +{pendingCount} بانتظار
                </span>
              ) : null}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="ms-1 h-4 w-4" /> خروج</Button>
          </div>
        </div>
        {!online ? (
          <div className="border-t border-rose-400/30 bg-rose-500/10 px-4 py-1.5 text-center text-[11px] font-medium text-rose-200">
            وضع قراءة الباركود أوفلاين — كل عمليات التسجيل تُحفظ محلياً وتتم مزامنتها فور عودة الاتصال
          </div>
        ) : null}
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
                          {(() => {
                            const groupSize = (g.companions_count ?? 0) + 1;
                            const current = g.attended_count ?? 0;
                            const full = current >= groupSize;
                            const declined = g.rsvp_status === "declined";
                            const partial = current > 0 && !full;
                            // ربط الحالة بالإجراء: الزر يتفعّل فقط إذا كانت الحالة "مقبول"
                            // أو "حضر" بشكل جزئي (لإكمال بقية المجموعة). أي حالة أخرى
                            // (معلّق/معتذر) تُعطّل الزر.
                            const allowedStatus = g.rsvp_status === "accepted" || (g.rsvp_status === "attended" && partial);
                            const disabled = full || declined || !allowedStatus;
                            const label = declined
                              ? "معتذر"
                              : full
                                ? `مكتمل (${current}/${groupSize})`
                                : partial
                                  ? `إكمال (${current}/${groupSize})`
                                  : g.rsvp_status === "pending"
                                    ? "بانتظار الرد"
                                    : groupSize > 1 ? `حضور (0/${groupSize})` : "حضور";
                            return (
                              <Button
                                size="sm"
                                variant={disabled ? "outline" : "default"}
                                disabled={disabled}
                                onClick={() => handleScan(g)}
                                className={disabled ? "" : "gold-gradient text-primary-foreground"}
                              >
                                <Check className="ms-1 h-3 w-3" /> {label}
                              </Button>
                            );
                          })()}
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
                guests={guests}
                lastScan={lastScan}
                onScanGuest={handleScan}
                onUnknown={(token) => { beep("error"); setInvalidMsg(`تنبيه: هذا الكود غير معروف أو غير فعّال!\nالرمز: ${token.slice(0, 12)}...`); }}
              />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>

      <AdmitDialog
        state={admitState}
        onClose={() => setAdmitState(null)}
        onConfirm={async (n) => { if (admitState) { await admitGuest(admitState.guest, n); setAdmitState(null); } }}
      />
      <InvalidCodeDialog message={invalidMsg} onClose={() => setInvalidMsg(null)} />
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

/**
 * Pure QR decoder. All admission decisions and audio/visual feedback live in
 * the parent (`handleScan`) so list buttons and scan share one code path.
 */
function CoordinatorScanner({ guests, lastScan, onScanGuest, onUnknown }: { guests: Guest[]; lastScan: Guest | null; onScanGuest: (g: Guest) => void; onUnknown: (token: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const elId = "coord-qr-reader";
  const last = lastScan;
  // Keep latest callbacks in refs so the scanner effect doesn't restart per render.
  const onScanRef = useRef(onScanGuest);
  const onUnknownRef = useRef(onUnknown);
  const guestsRef = useRef(guests);
  useEffect(() => { onScanRef.current = onScanGuest; onUnknownRef.current = onUnknown; guestsRef.current = guests; }, [onScanGuest, onUnknown, guests]);

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
            const token = decoded.includes("/i/") ? decoded.split("/i/")[1].split(/[?#]/)[0] : decoded.trim();
            if (!token || token.length < 4 || token.length > 128) { onUnknownRef.current(token || decoded); return; }
            const now = Date.now();
            if (token === lastToken && now - lastAt < 2500) return;
            lastToken = token; lastAt = now;
            const g = guestsRef.current.find(x => x.token === token);
            if (!g) { onUnknownRef.current(token); return; }
            onScanRef.current(g);
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
  }, [scanning]);

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
            <p className="font-display text-xl font-bold">{last.title ? `${last.title} ` : ""}{last.name}</p>
            <p className="mt-1 text-sm">المرافقون: <span className="font-bold text-gold">{last.companions_count}</span></p>
            {last.companion_names && last.companion_names.length > 0 ? (
              <div className="mt-3 rounded-lg border border-gold/30 bg-gold/5 p-3 text-right text-sm">
                <Label className="text-xs">أسماء المرافقين</Label>
                <ul className="mt-1 space-y-0.5 text-foreground/90">
                  {last.companion_names.map((n, i) => <li key={i}>• {n || "—"}</li>)}
                </ul>
              </div>
            ) : null}
            {last.attended_count != null ? (
              <p className="mt-2 text-xs text-muted-foreground">عدد من دخل من المجموعة: <span className="font-bold text-foreground">{last.attended_count}</span> / {(last.companions_count ?? 0) + 1}</p>
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
    </div>
  );
}