import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { HostShell } from "@/components/host-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { InvitationCard, type TemplateConfig, type TimelineItem } from "@/components/invitation-card";
import { RSVP_LABELS, RSVP_COLORS, formatArabicDate, eventTypeLabel } from "@/lib/event-utils";
import { Upload, Plus, Trash2, Save, Link as LinkIcon, Copy, Search, ScanLine, Bell, MailCheck, MessageCircle, UserCog, Download, Pencil, Clock, Eye, EyeOff, Plug, Tag, ShieldCheck, AlertTriangle, Image as ImageIcon, Check as CheckIcon, X as XIcon, Heart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import Papa from "papaparse";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ErrorBoundary } from "@/components/error-boundary";
import { getWhatsAppConfig, saveWhatsAppConfig, simulateWhatsAppBlast, normalizePhone, splitTitleName, sanitizeTemplate, applyTemplate, DEFAULT_WA_CONFIG, DEFAULT_WA_TEMPLATE, type WhatsAppConfig } from "@/lib/whatsapp";
import { listCoordinators, createCoordinator, deleteCoordinator, updateCoordinator } from "@/lib/coordinator.functions";
import { Switch } from "@/components/ui/switch";
import { WhatsAppMobilePreview } from "@/components/whatsapp-mobile-preview";
import { Slider } from "@/components/ui/slider";
import { Music } from "lucide-react";

export const Route = createFileRoute("/_authenticated/events/$eventId")({
  head: () => ({ meta: [{ title: "إدارة الفعالية — دعوتي" }] }),
  component: EventDetails,
});

type EventRow = {
  id: string; name: string; event_type: string; event_date: string;
  location: string | null; location_url: string | null; description: string | null;
  slug: string; template_config: TemplateConfig;
};
type Guest = {
  id: string; event_id: string; token: string; name: string; phone: string | null;
  email: string | null; rsvp_status: string; companions_count: number; notes: string | null;
  original_rsvp_status?: string | null;
  status_overridden_by_host?: boolean | null;
};

const TITLE_OPTIONS = [
  "المكرم","المكرمة","الأستاذ","الأستاذة","الدكتور","الدكتورة",
  "الشيخ","الشيخة","المهندس","المهندسة","الأمير","الأميرة",
];
const MAX_COMPANIONS = 11;

function joinTitleName(title: string, name: string): string {
  const t = (title || "").trim();
  const n = (name || "").trim();
  return t ? `${t} / ${n}`.slice(0, 160) : n.slice(0, 120);
}

const PRESETS = [
  { name: "ذهبي كلاسيكي", config: { template: "gold", bg_color: "#f7f1e6", text_color: "#1a1410", accent_color: "#c9a24a", font: "amiri" } },
  { name: "أسود فاخر", config: { template: "noir", bg_color: "#0d0d0d", text_color: "#f5f0e0", accent_color: "#d4af37", font: "amiri" } },
  { name: "وردي ناعم", config: { template: "rose", bg_color: "#fdf2f4", text_color: "#3a2e2a", accent_color: "#c9a0a8", font: "tajawal" } },
  { name: "أخضر زيتي", config: { template: "olive", bg_color: "#f5f7f0", text_color: "#2b3624", accent_color: "#6b7f5a", font: "amiri" } },
];

function EventDetails() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: e } = await supabase.from("events").select("*").eq("id", eventId).single();
    setEvent(e as EventRow);
    const { data: g } = await supabase.from("guests").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
    setGuests((g || []) as Guest[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [eventId]);

  if (loading || !event) return <HostShell><p className="text-muted-foreground">جاري التحميل...</p></HostShell>;

  const inviteUrl = (token: string) => `${window.location.origin}/i/${token}`;

  return (
    <HostShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2 border-primary/40 text-gold">{eventTypeLabel(event.event_type)}</Badge>
          <h1 className="font-display text-3xl font-bold">{event.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatArabicDate(event.event_date)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={async () => {
          const url = `${window.location.origin}/e/${event.slug}`;
          try {
            if (navigator.clipboard && window.isSecureContext) {
              await navigator.clipboard.writeText(url);
            } else {
              const ta = document.createElement("textarea");
              ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0";
              document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
            }
            toast.success("تم نسخ رابط الفعالية");
          } catch {
            toast.error("تعذّر النسخ — انسخ الرابط يدوياً: " + url);
          }
        }}>
          <LinkIcon className="ms-2 h-4 w-4" /> نسخ رابط الفعالية
        </Button>
          <DeleteEventDialog event={event} onDeleted={() => navigate({ to: "/dashboard" })} />
        </div>
      </div>

      <Tabs defaultValue="builder">
        <div className="-mx-2 overflow-x-auto px-2">
          <TabsList className="flex w-max min-w-full flex-nowrap">
            <TabsTrigger value="builder">بطاقة الدعوة</TabsTrigger>
            <TabsTrigger value="guests">المدعوون ({guests.length})</TabsTrigger>
            <TabsTrigger value="rsvp">تتبع الردود</TabsTrigger>
            <TabsTrigger value="automation">التذكيرات</TabsTrigger>
            <TabsTrigger value="coordinators">المنسقون</TabsTrigger>
            <TabsTrigger value="integrations">التكاملات</TabsTrigger>
            <TabsTrigger value="wishes">حائط التهاني والاعتذارات</TabsTrigger>
            <TabsTrigger value="scanner">مسح QR</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="builder" className="mt-6">
          <BuilderTab event={event} onSaved={load} />
        </TabsContent>
        <TabsContent value="guests" className="mt-6">
          <GuestsTab event={event} guests={guests} reload={load} inviteUrl={inviteUrl} />
        </TabsContent>
        <TabsContent value="rsvp" className="mt-6">
          <RsvpTab guests={guests} />
        </TabsContent>
        <TabsContent value="automation" className="mt-6">
          <AutomationTab event={event} guests={guests} />
        </TabsContent>
        <TabsContent value="coordinators" className="mt-6">
          <CoordinatorsTab eventId={event.id} />
        </TabsContent>
        <TabsContent value="integrations" className="mt-6">
          <EventIntegrationsTab eventId={event.id} />
        </TabsContent>
        <TabsContent value="wishes" className="mt-6">
          <WishesWallTab guests={guests} />
        </TabsContent>
        <TabsContent value="scanner" className="mt-6">
          <ErrorBoundary title="تعذّر تشغيل ماسح QR">
            <ScannerTab eventId={event.id} onCheckIn={load} />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </HostShell>
  );
}

/* ---------------- Builder ---------------- */
function BuilderTab({ event, onSaved }: { event: EventRow; onSaved: () => void }) {
  const [cfg, setCfg] = useState<TemplateConfig>(event.template_config || {});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("events").update({ template_config: cfg }).eq("id", event.id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("تم حفظ التصميم"); onSaved(); }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="mb-4 font-display text-lg font-bold">القوالب الجاهزة</h3>
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => setCfg({ ...cfg, ...p.config })}
              className="rounded-xl border border-border p-3 text-right transition hover:border-primary">
              <div className="mb-2 h-12 rounded" style={{ background: p.config.bg_color, borderColor: p.config.accent_color, borderWidth: 1 }} />
              <p className="text-sm font-medium">{p.name}</p>
            </button>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>عنوان مخصص</Label>
            <Input value={cfg.custom_title || ""} onChange={e => setCfg({ ...cfg, custom_title: e.target.value })} placeholder={event.name} />
          </div>
          <div className="space-y-2">
            <Label>رسالة الدعوة</Label>
            <Textarea rows={3} value={cfg.custom_message || ""} onChange={e => setCfg({ ...cfg, custom_message: e.target.value })} placeholder="يسرّنا دعوتكم لمشاركتنا فرحة..." />
          </div>
          <TimelineEditor
            items={cfg.timeline || []}
            onChange={(items: TimelineItem[]) => setCfg({ ...cfg, timeline: items })}
          />
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Clock className="h-4 w-4 text-gold" /> مهلة تأكيد الحضور (اختياري)</Label>
            <Input
              type="datetime-local"
              value={cfg.rsvp_deadline ? toLocalInput(cfg.rsvp_deadline) : ""}
              onChange={e => setCfg({ ...cfg, rsvp_deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">بعد هذا الموعد لن يتمكن المدعوون من تأكيد أو الاعتذار عن الحضور.</p>
            {cfg.rsvp_deadline ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setCfg({ ...cfg, rsvp_deadline: null })}>
                إزالة المهلة
              </Button>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><Label>الخلفية</Label><Input type="color" value={cfg.bg_color || "#f7f1e6"} onChange={e => setCfg({ ...cfg, bg_color: e.target.value })} /></div>
            <div className="space-y-2"><Label>النص</Label><Input type="color" value={cfg.text_color || "#1a1410"} onChange={e => setCfg({ ...cfg, text_color: e.target.value })} /></div>
            <div className="space-y-2"><Label>اللون المميز</Label><Input type="color" value={cfg.accent_color || "#c9a24a"} onChange={e => setCfg({ ...cfg, accent_color: e.target.value })} /></div>
          </div>
          <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
            <Label>لون خلفية صفحة الدعوة (المنطقة المحيطة بالبطاقة)</Label>
            <div className="flex items-center gap-2">
              <Input type="color" value={cfg.page_bg || "#1a1410"} onChange={e => setCfg({ ...cfg, page_bg: e.target.value })} className="h-10 w-16 p-1" />
              <Input value={cfg.page_bg || ""} onChange={e => setCfg({ ...cfg, page_bg: e.target.value })} placeholder="مثال: #1a1410 أو linear-gradient(...)" dir="ltr" />
              {cfg.page_bg ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setCfg({ ...cfg, page_bg: "" })}>إعادة</Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">يُطبَّق على كامل الصفحة الخارجية لرابط الدعوة، وليس داخل البطاقة.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-muted/20 p-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>نص العنوان العلوي</Label>
              <Input value={cfg.intro_label ?? ""} onChange={e => setCfg({ ...cfg, intro_label: e.target.value })} placeholder="دعوة كريمة" />
            </div>
            <div className="space-y-2">
              <Label>عبارة الترحيب قبل اسم المدعو</Label>
              <Input value={cfg.greeting_prefix ?? ""} onChange={e => setCfg({ ...cfg, greeting_prefix: e.target.value })} placeholder="يسرّنا دعوتك يا" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>الخط</Label>
            <Select value={cfg.font || "amiri"} onValueChange={v => setCfg({ ...cfg, font: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cairo">Cairo (النسخ)</SelectItem>
                <SelectItem value="tajawal">Tajawal (الرقعة)</SelectItem>
                <SelectItem value="amiri">Amiri (الديواني)</SelectItem>
                <SelectItem value="reem-kufi">Reem Kufi (الكوفي)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <BackgroundControls cfg={cfg} setCfg={setCfg} />
          <TypographyControls cfg={cfg} setCfg={setCfg} />
          <AudioControls cfg={cfg} setCfg={setCfg} />
          <Button onClick={save} disabled={saving} className="w-full gold-gradient text-primary-foreground">
            <Save className="ms-2 h-4 w-4" /> {saving ? "..." : "حفظ التصميم"}
          </Button>
        </div>
      </Card>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-sm text-muted-foreground">معاينة مباشرة</p>
        <InvitationCard config={cfg} eventName={event.name} eventDate={event.event_date} location={event.location} guestName="ضيفنا الكريم" />
      </div>
    </div>
  );
}

/* ---------------- Guests ---------------- */
function GuestsTab({ event, guests, reload, inviteUrl }: { event: EventRow; guests: Guest[]; reload: () => void; inviteUrl: (t: string) => string }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => guests.filter(g =>
    (g.name.toLowerCase().includes(q.toLowerCase()) || (g.phone || "").includes(q)) &&
    (!statusFilter || g.rsvp_status === statusFilter),
  ), [guests, q, statusFilter]);
  const pageSize = 10;
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const [importing, setImporting] = useState(false);
  const [waSending, setWaSending] = useState(false);
  const [waProgress, setWaProgress] = useState<{ processed: number; total: number; sent: number; failed: number; skipped: number; currentName: string; etaSeconds: number } | null>(null);
  const waAbortRef = useRef<AbortController | null>(null);
  const [editing, setEditing] = useState<Guest | null>(null);

  const handleFile = (file: File) => {
    const lower = file.name.toLowerCase();
    if (!/\.(csv|xlsx?|tsv|txt)$/i.test(lower)) {
      toast.error("صيغة الملف غير مدعومة. استخدم CSV أو Excel.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setImporting(true);
    try {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (h) => (h || "").trim(),
        complete: async (res) => {
          try {
            const data = Array.isArray(res.data) ? res.data : [];
            if (!data.length) {
              toast.error("الملف فارغ أو لا يحتوي على صفوف صالحة");
              return;
            }
            let skippedNoName = 0, skippedBadPhone = 0;
            const rows = data.flatMap((r) => {
              if (!r || typeof r !== "object") return [];
              const keys = Object.keys(r);
              const k = (...names: string[]) => keys.find(x => names.some(n => x.toLowerCase().includes(n))) || "";
              // Strict 4-column structure: A=اللقب, B=اسم الضيف, C=رقم الجوال, D=المرافقين
              const titleRaw = String(r[k("اللقب", "title", "لقب")] || "").trim();
              const nameRaw = String(r[k("اسم الضيف", "اسم", "name")] || "").trim();
              const phoneRaw = String(r[k("جوال", "هاتف", "phone", "mobile")] || "").trim();
              const compRaw = String(r[k("مرافق", "companion", "guests")] || "").trim();
              const cleanName = sanitizeCell(nameRaw);
              const cleanTitle = sanitizeCell(titleRaw);
              if (!cleanName) { skippedNoName++; return []; }
              const fullName = cleanTitle ? `${cleanTitle} / ${cleanName}`.slice(0, 160) : cleanName.slice(0, 120);
              let phone: string | null = null;
              if (phoneRaw) {
                const norm = normalizePhone(phoneRaw);
                if (!norm) { skippedBadPhone++; phone = null; } else phone = norm;
              }
              const compNum = Math.max(0, Math.min(MAX_COMPANIONS, parseInt(compRaw.replace(/[^\d]/g, ""), 10) || 0));
              return [{ event_id: event.id, name: fullName, phone, email: null, companions_count: compNum }];
            });
            if (!rows.length) {
              toast.error("لم يتم العثور على أسماء صالحة في الملف");
              return;
            }
            const { error } = await supabase.from("guests").insert(rows);
            if (error) { toast.error(error.message); return; }
            const warn: string[] = [];
            if (skippedNoName) warn.push(`${skippedNoName} صف بدون اسم`);
            if (skippedBadPhone) warn.push(`${skippedBadPhone} رقم هاتف غير صالح`);
            toast.success(`تم استيراد ${rows.length} مدعو${warn.length ? ` · تجاوزنا: ${warn.join("، ")}` : ""}`);
            reload();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "تعذّر معالجة الملف");
          } finally {
            setImporting(false);
            if (fileRef.current) fileRef.current.value = "";
          }
        },
        error: (err) => {
          toast.error(err?.message || "تعذّر قراءة الملف");
          setImporting(false);
          if (fileRef.current) fileRef.current.value = "";
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ أثناء الاستيراد");
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const sendWhatsApp = async () => {
    if (waSending) return;
    const cfg = getWhatsAppConfig(event.id);
    if (!cfg.api_key || !cfg.instance_id) {
      toast.error("يرجى ضبط بيانات WhatsApp من تبويب التكاملات داخل هذه الفعالية");
      return;
    }
    const recipients = guests
      .filter(g => g.phone)
      .map(g => {
        const { title, name } = splitTitleName(g.name);
        return { title, name, phone: g.phone, url: inviteUrl(g.token) };
      });
    if (!recipients.length) {
      toast.error("لا يوجد مدعوون بأرقام هاتف");
      return;
    }
    setWaSending(true);
    setWaProgress({ processed: 0, total: recipients.length, sent: 0, failed: 0, skipped: 0, currentName: "", etaSeconds: recipients.length * 7 });
    const ac = new AbortController();
    waAbortRef.current = ac;
    try {
      const r = await simulateWhatsAppBlast(cfg, recipients, {
        minDelayMs: 5000,
        maxDelayMs: 10000,
        signal: ac.signal,
        onProgress: (p) => setWaProgress(p),
      });
      toast.success(`تم الإرسال · نجح ${r.sent}${r.failed ? ` · فشل ${r.failed}` : ""}${r.skipped ? ` · تخطّينا ${r.skipped}` : ""}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر الإرسال");
    } finally {
      setWaSending(false);
      waAbortRef.current = null;
      // keep progress card visible briefly so the user sees the final state
      setTimeout(() => setWaProgress(null), 4000);
    }
  };

  const cancelWhatsApp = () => {
    waAbortRef.current?.abort();
    toast.message("تم إيقاف الإرسال");
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا المدعو؟")) return;
    await supabase.from("guests").delete().eq("id", id);
    toast.success("تم الحذف");
    reload();
  };

  const counts = useMemo(() => guests.reduce((a, g) => { a[g.rsvp_status] = (a[g.rsvp_status] || 0) + 1; return a; }, {} as Record<string, number>), [guests]);
  const toggleFilter = (s: string) => { setStatusFilter(prev => prev === s ? null : s); setPage(0); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(["accepted","declined","pending","attended"] as const).map(s => (
          <button key={s} type="button" onClick={() => toggleFilter(s)} className="text-right">
            <Card className={`p-3 transition hover:shadow-md ${statusFilter === s ? "ring-2 ring-primary border-primary" : ""}`}>
              <p className="text-xs text-muted-foreground">{RSVP_LABELS[s]}</p>
              <p className="mt-1 font-display text-2xl font-bold" style={{ color: RSVP_COLORS[s] }}>{counts[s] || 0}</p>
            </Card>
          </button>
        ))}
      </div>
      {statusFilter ? (
        <p className="text-xs text-muted-foreground">
          مرشّح حسب: <span className="font-bold">{RSVP_LABELS[statusFilter]}</span>{" · "}
          <button onClick={() => setStatusFilter(null)} className="text-gold underline">إزالة الفلتر</button>
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => { setQ(e.target.value); setPage(0); }} placeholder="بحث بالاسم أو الهاتف..." className="ps-3 pe-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,text/csv" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <Button variant="outline" disabled={importing} onClick={() => fileRef.current?.click()}>
            <Upload className="ms-2 h-4 w-4" /> {importing ? "جارٍ الاستيراد..." : "استيراد Excel/CSV"}
          </Button>
          <Button variant="outline" onClick={downloadGuestTemplate}>
            <Download className="ms-2 h-4 w-4" /> تصدير نموذج إكسل
          </Button>
          <Button variant="outline" disabled={waSending || !guests.length} onClick={sendWhatsApp} className="border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10">
            <MessageCircle className="ms-2 h-4 w-4" /> {waSending ? "جارٍ الإرسال..." : "إرسال عبر WhatsApp"}
          </Button>
          <DeleteAllGuestsDialog eventId={event.id} count={guests.length} onDeleted={reload} />
          <AddGuestDialog eventId={event.id} onAdded={reload} />
        </div>
      </div>

      {waProgress ? (
        <Card className="border-emerald-500/40 bg-emerald-500/5 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              {waSending ? "جاري المعالجة..." : "اكتملت العملية"} — تم إرسال {waProgress.processed} من أصل {waProgress.total}
            </p>
            {waSending ? (
              <Button variant="ghost" size="sm" onClick={cancelWhatsApp}>إيقاف</Button>
            ) : null}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-500/15">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${Math.round((waProgress.processed / Math.max(1, waProgress.total)) * 100)}%` }}
            />
          </div>
          <p className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>الحالي: <span className="font-medium text-foreground">{waProgress.currentName || "—"}</span></span>
            <span>نجح {waProgress.sent} · فشل {waProgress.failed} · تخطّينا {waProgress.skipped}</span>
            <span>الوقت المتبقي تقريباً: {waProgress.etaSeconds > 60 ? `${Math.floor(waProgress.etaSeconds / 60)} د ${waProgress.etaSeconds % 60} ث` : `${waProgress.etaSeconds} ث`}</span>
          </p>
        </Card>
      ) : null}

      {guests[0] ? (
        <Card className="flex items-center justify-between gap-3 border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full gold-gradient text-primary-foreground">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">آخر مدعو تم تسجيله</p>
              <p className="font-display text-lg font-bold">{guests[0].name}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">{formatArabicDate(new Date())}</Badge>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اللقب</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>رقم الجوال</TableHead>
              <TableHead>المرافقين</TableHead>
              <TableHead>حالة الدعوة</TableHead>
              <TableHead>الملاحظات</TableHead>
              <TableHead>الدعوة</TableHead>
              <TableHead className="w-24">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">لا يوجد مدعوون</TableCell></TableRow>
            ) : paged.map(g => {
              const { title, name } = splitTitleName(g.name);
              return (
                <TableRow key={g.id}>
                  <TableCell className="text-sm text-muted-foreground">{title || "—"}</TableCell>
                  <TableCell className="font-medium">{name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground" dir="ltr">{g.phone || "—"}</TableCell>
                  <TableCell className="text-sm tabular-nums">{g.companions_count || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge style={{ background: RSVP_COLORS[g.rsvp_status], color: "#fff" }}>{RSVP_LABELS[g.rsvp_status]}</Badge>
                      {g.status_overridden_by_host ? (
                        <span className="text-[10px] text-muted-foreground" title="تم التعديل من قِبل المنظم">(معدل)</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">{g.notes || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(inviteUrl(g.token)); toast.success("تم النسخ"); }}>
                      <Copy className="ms-1 h-3 w-3" /> نسخ
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" title="تعديل" onClick={() => setEditing(g)}>
                        <Pencil className="h-4 w-4 text-gold" />
                      </Button>
                      <Button variant="ghost" size="icon" title="حذف" onClick={() => remove(g.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </Card>

      <EditGuestDialog guest={editing} onClose={() => setEditing(null)} onSaved={reload} />

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{filtered.length} مدعو</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>السابق</Button>
          <span className="px-3 py-1">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>التالي</Button>
        </div>
      </div>
    </div>
  );
}

function AddGuestDialog({ eventId, onAdded }: { eventId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [titleMode, setTitleMode] = useState<"preset" | "custom">("preset");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companions, setCompanions] = useState(0);
  const submit = async () => {
    if (!name.trim()) return;
    const normPhone = phone ? (normalizePhone(phone) || phone.trim()) : null;
    const c = Math.max(0, Math.min(MAX_COMPANIONS, Number(companions) || 0));
    const { error } = await supabase.from("guests").insert({
      event_id: eventId,
      name: joinTitleName(title, name),
      phone: normPhone,
      companions_count: c,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("تمت الإضافة");
      setTitle(""); setName(""); setPhone(""); setCompanions(0);
      setOpen(false); onAdded();
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gold-gradient text-primary-foreground"><Plus className="ms-1 h-4 w-4" /> إضافة مدعو</Button></DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>إضافة مدعو</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>اللقب</Label>
              <button type="button" className="text-xs text-gold underline" onClick={() => setTitleMode(titleMode === "preset" ? "custom" : "preset")}>
                {titleMode === "preset" ? "إدخال يدوي" : "اختيار من القائمة"}
              </button>
            </div>
            {titleMode === "preset" ? (
              <Select value={title} onValueChange={setTitle}>
                <SelectTrigger><SelectValue placeholder="اختر اللقب (اختياري)" /></SelectTrigger>
                <SelectContent>
                  {TITLE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: سعادة" />
            )}
          </div>
          <div><Label>الاسم</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="اسم المدعو" /></div>
          <div><Label>رقم الجوال</Label><Input value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" inputMode="tel" placeholder="05xxxxxxxx" /></div>
          <div>
            <Label>عدد المرافقين</Label>
            <Input type="number" min={0} max={MAX_COMPANIONS} value={companions}
              onChange={e => setCompanions(Math.max(0, Math.min(MAX_COMPANIONS, Number(e.target.value) || 0)))} />
            <p className="mt-1 text-xs text-muted-foreground">القيمة من 0 إلى {MAX_COMPANIONS}</p>
          </div>
        </div>
        <DialogFooter><Button onClick={submit} className="gold-gradient text-primary-foreground">إضافة</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditGuestDialog({ guest, onClose, onSaved }: { guest: Guest | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [titleMode, setTitleMode] = useState<"preset" | "custom">("preset");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companions, setCompanions] = useState(0);
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!guest) return;
    const { title: t, name: n } = splitTitleName(guest.name);
    setTitle(t);
    setTitleMode(t && !TITLE_OPTIONS.includes(t) ? "custom" : "preset");
    setName(n);
    setPhone(guest.phone || "");
    setCompanions(guest.companions_count || 0);
    setStatus(guest.rsvp_status || "pending");
    setNotes(guest.notes || "");
  }, [guest]);

  if (!guest) return null;
  const originalStatus = guest.original_rsvp_status || null;
  const isOverridden = originalStatus && originalStatus !== status;

  const save = async () => {
    if (!name.trim()) { toast.error("الاسم مطلوب"); return; }
    setSaving(true);
    const normPhone = phone ? (normalizePhone(phone) || phone.trim()) : null;
    const c = Math.max(0, Math.min(MAX_COMPANIONS, Number(companions) || 0));
    // Status is considered "overridden" only when there's a recorded guest choice and the host picked something different.
    const overridden = !!(guest.original_rsvp_status && guest.original_rsvp_status !== status);
    const { error } = await supabase.from("guests").update({
      name: joinTitleName(title, name),
      phone: normPhone,
      companions_count: c,
      rsvp_status: status,
      status_overridden_by_host: overridden,
      notes: notes.trim() ? notes.trim().slice(0, 500) : null,
    }).eq("id", guest.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم حفظ التعديلات");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!guest} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>تعديل بيانات المدعو</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>اللقب</Label>
              <button type="button" className="text-xs text-gold underline" onClick={() => setTitleMode(titleMode === "preset" ? "custom" : "preset")}>
                {titleMode === "preset" ? "إدخال يدوي" : "اختيار من القائمة"}
              </button>
            </div>
            {titleMode === "preset" ? (
              <Select value={title} onValueChange={setTitle}>
                <SelectTrigger><SelectValue placeholder="اختر اللقب" /></SelectTrigger>
                <SelectContent>
                  {TITLE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            )}
          </div>
          <div><Label>الاسم</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>رقم الجوال</Label><Input value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" inputMode="tel" /></div>
          <div>
            <Label>عدد المرافقين</Label>
            <Input type="number" min={0} max={MAX_COMPANIONS} value={companions}
              onChange={e => setCompanions(Math.max(0, Math.min(MAX_COMPANIONS, Number(e.target.value) || 0)))} />
          </div>
          <div className="space-y-2">
            <Label>حالة الدعوة</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{RSVP_LABELS.pending}</SelectItem>
                <SelectItem value="accepted">{RSVP_LABELS.accepted}</SelectItem>
                <SelectItem value="declined">{RSVP_LABELS.declined}</SelectItem>
                <SelectItem value="attended">{RSVP_LABELS.attended}</SelectItem>
              </SelectContent>
            </Select>
            {originalStatus ? (
              <div className={`rounded-lg border p-2 text-xs ${isOverridden ? "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200" : "border-border bg-muted/30 text-muted-foreground"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    اختيار الضيف الأصلي:{" "}
                    <span className="font-bold" style={{ color: RSVP_COLORS[originalStatus] }}>
                      {RSVP_LABELS[originalStatus] || originalStatus}
                    </span>
                  </span>
                  {isOverridden ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setStatus(originalStatus)}>
                      الرجوع لاختيار الضيف
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">لم يقم الضيف بالرد بعد.</p>
            )}
          </div>
          <div>
            <Label>الملاحظات</Label>
            <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={save} disabled={saving} className="gold-gradient text-primary-foreground">
            {saving ? "..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- RSVP ---------------- */
function RsvpTab({ guests }: { guests: Guest[] }) {
  const counts = guests.reduce((acc, g) => { acc[g.rsvp_status] = (acc[g.rsvp_status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const totalWithCompanions = guests.filter(g => g.rsvp_status === "accepted" || g.rsvp_status === "attended").reduce((a, g) => a + 1 + g.companions_count, 0);
  const data = ["accepted", "declined", "pending", "attended"].map(s => ({ name: RSVP_LABELS[s], value: counts[s] || 0, key: s }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="mb-4 font-display text-lg font-bold">الإحصاءات</h3>
        <div className="grid grid-cols-2 gap-3">
          {data.map(d => (
            <div key={d.key} className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">{d.name}</p>
              <p className="mt-2 font-display text-3xl font-bold" style={{ color: RSVP_COLORS[d.key] }}>{d.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl gold-gradient p-4 text-primary-foreground">
          <p className="text-sm opacity-90">الحضور المتوقع (مع المرافقين)</p>
          <p className="mt-1 font-display text-3xl font-bold">{totalWithCompanions}</p>
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="mb-4 font-display text-lg font-bold">توزيع الردود</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
                {data.map(d => <Cell key={d.key} fill={RSVP_COLORS[d.key]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Automation ---------------- */
function AutomationTab({ event, guests }: { event: EventRow; guests: Guest[] }) {
  const pending = guests.filter(g => g.rsvp_status === "pending").length;
  const accepted = guests.filter(g => g.rsvp_status === "accepted").length;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <AutomationCard
        icon={MailCheck}
        title="إرسال الدعوات الأولية"
        desc={`إرسال رابط الدعوة لجميع المدعوين (${guests.length}) عبر الرسائل النصية أو البريد.`}
        action="إرسال للجميع"
        meta="جاهز للإرسال"
      />
      <AutomationCard
        icon={Bell}
        title="تذكير من لم يرد"
        desc={`إرسال تذكير لطيف لـ ${pending} مدعو لم يرد بعد، قبل 48 ساعة من الموعد.`}
        action="جدولة تذكير"
        meta="قبل 48 ساعة"
      />
      <AutomationCard
        icon={ScanLine}
        title="رمز QR للحاضرين"
        desc={`إرسال QR والموقع لـ ${accepted} مدعو قبل يوم من الفعالية.`}
        action="جدولة الإرسال"
        meta={`يوم ${formatArabicDate(event.event_date)}`}
      />
    </div>
  );
}

function AutomationCard({ icon: Icon, title, desc, action, meta }: { icon: typeof Bell; title: string; desc: string; action: string; meta: string }) {
  return (
    <Card className="p-6">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl gold-gradient text-primary-foreground"><Icon className="h-6 w-6" /></div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-4 flex items-center justify-between">
        <Badge variant="outline">{meta}</Badge>
        <Button variant="outline" size="sm" onClick={() => toast.info("سيتم تفعيل الإرسال قريباً")}>{action}</Button>
      </div>
    </Card>
  );
}

/* ---------------- Scanner ---------------- */
function ScannerTab({ eventId, onCheckIn }: { eventId: string; onCheckIn: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [lastGuest, setLastGuest] = useState<Guest | null>(null);
  const elId = "qr-reader";

  useEffect(() => {
    if (!scanning) return;
    let html5: { stop: () => Promise<void>; clear: () => void } | null = null;
    let cancelled = false;
    let lastToken = "";
    let lastAt = 0;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      const scanner = new Html5Qrcode(elId);
      html5 = scanner as unknown as { stop: () => Promise<void>; clear: () => void };
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decoded: string) => {
            try {
              const token = decoded.includes("/i/") ? decoded.split("/i/")[1].split(/[?#]/)[0] : decoded.trim();
              if (!token || token.length < 4 || token.length > 128) { toast.error("رمز غير صالح"); return; }
              const now = Date.now();
              if (token === lastToken && now - lastAt < 2500) return;
              lastToken = token; lastAt = now;
            const { data: guest } = await supabase.from("guests").select("*").eq("token", token).eq("event_id", eventId).single();
            if (!guest) { toast.error("لم يتم التعرف على المدعو"); return; }
            if (guest.rsvp_status === "attended") {
              const when = guest.checked_in_at ? formatArabicDate(guest.checked_in_at) : "—";
              toast.warning(`هذا الرمز تم استخدامه بالفعل! وقت التسجيل: ${when}`);
              setLastGuest({ ...guest } as Guest);
              return;
            }
            await supabase.from("guests").update({ rsvp_status: "attended", checked_in_at: new Date().toISOString() }).eq("id", guest.id);
            setLastGuest({ ...guest, rsvp_status: "attended" } as Guest);
            toast.success(`أهلاً ${guest.name}`);
            onCheckIn();
            } catch (err) {
              console.error(err);
              toast.error("تعذّر معالجة الرمز");
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
    return () => { cancelled = true; html5?.stop().then(() => html5?.clear()).catch(() => {}); };
  }, [scanning, eventId, onCheckIn]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="mb-4 font-display text-lg font-bold">مسح QR الحضور</h3>
        {!scanning ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <ScanLine className="mx-auto h-12 w-12 text-gold" />
            <p className="mt-3 text-sm text-muted-foreground">امسح رمز QR من بطاقة المدعو</p>
            <Button onClick={() => setScanning(true)} className="mt-4 gold-gradient text-primary-foreground">بدء المسح</Button>
          </div>
        ) : (
          <div>
            <div id={elId} className="overflow-hidden rounded-xl" />
            <Button variant="outline" onClick={() => setScanning(false)} className="mt-3 w-full">إيقاف</Button>
          </div>
        )}
      </Card>
      <Card className="p-6">
        <h3 className="mb-4 font-display text-lg font-bold">آخر مدعو تم تسجيله</h3>
        {lastGuest ? (
          <div className="rounded-xl border border-primary/40 p-6 text-center">
            <p className="text-sm text-muted-foreground">أهلاً بـ</p>
            <p className="mt-1 font-display text-2xl font-bold">{lastGuest.name}</p>
            <p className="mt-3">المرافقون: <span className="font-bold text-gold">{lastGuest.companions_count}</span></p>
            {lastGuest.notes ? <p className="mt-2 text-sm text-muted-foreground">ملاحظات: {lastGuest.notes}</p> : null}
            <Badge className="mt-3" style={{ background: RSVP_COLORS.attended, color: "#fff" }}>تم تسجيل الحضور</Badge>
          </div>
        ) : (
          <p className="text-muted-foreground">لم يتم مسح أي رمز بعد</p>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Coordinators ---------------- */
type CoordinatorRow = { id: string; name: string; username: string; last_login_at: string | null; created_at: string };

function CoordinatorsTab({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<CoordinatorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [editRow, setEditRow] = useState<CoordinatorRow | null>(null);

  const load = async () => {
    try {
      const r = await listCoordinators({ data: { event_id: eventId } });
      setRows(r as CoordinatorRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر التحميل");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [eventId]);

  const submit = async () => {
    if (saving) return;
    if (!name.trim() || !username.trim() || password.length < 6) {
      toast.error("جميع الحقول مطلوبة وكلمة المرور لا تقل عن 6 أحرف");
      return;
    }
    setSaving(true);
    try {
      await createCoordinator({ data: { event_id: eventId, name: name.trim(), username: username.trim(), password } });
      toast.success("تم إنشاء المنسق");
      setName(""); setUsername(""); setPassword(""); setOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر الإنشاء");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا المنسق؟ سيفقد الوصول فوراً.")) return;
    try {
      await deleteCoordinator({ data: { id } });
      setRows(prev => prev.filter(r => r.id !== id));
      toast.success("تم الحذف");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر الحذف");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold">منسقو الفعالية</h3>
            <p className="mt-1 text-sm text-muted-foreground">يمكن للمنسق فقط رؤية قائمة المدعوين وتسجيل الحضور ومسح QR لهذه الفعالية، دون الوصول لإعداداتك أو فعالياتك الأخرى.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gold-gradient text-primary-foreground"><Plus className="ms-1 h-4 w-4" /> منسق جديد</Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>إضافة منسق</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>الاسم</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                <div><Label>اسم المستخدم</Label><Input value={username} onChange={e => setUsername(e.target.value)} dir="ltr" placeholder="ahmed_2025" /></div>
                <div><Label>كلمة المرور (6 أحرف فأكثر)</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
              </div>
              <DialogFooter>
                <Button onClick={submit} disabled={saving} className="gold-gradient text-primary-foreground">{saving ? "..." : "إنشاء"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">جاري التحميل...</p> : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <UserCog className="mx-auto h-10 w-10 text-gold" />
            <p className="mt-2 text-sm text-muted-foreground">لا يوجد منسقون بعد لهذه الفعالية</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>اسم المستخدم</TableHead>
                <TableHead>آخر دخول</TableHead>
                <TableHead className="w-28">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-sm" dir="ltr">{r.username}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.last_login_at ? formatArabicDate(r.last_login_at) : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditRow(r)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          رابط دخول المنسقين: <span className="font-mono text-foreground" dir="ltr">/c/login</span>
        </div>
      </Card>
      <EditCoordinatorDialog row={editRow} onClose={() => setEditRow(null)} onSaved={load} />
    </div>
  );
}


function downloadGuestTemplate() {
  const headers = ["اللقب", "الاسم", "رقم الجوال", "المرافقين"];
  const sample = [
    ["المكرم", "محمد بن سعيد", "+966500000000", "2"],
    ["المكرمة", "فاطمة بنت أحمد", "0551234567", "0"],
  ];
  const safe = (c: string) => {
    const v = c || "";
    // CSV injection guard: prefix risky leading chars
    const needsGuard = /^[=+\-@\t\r]/.test(v);
    return `"${(needsGuard ? "'" + v : v).replace(/"/g, '""')}"`;
  };
  const rows = [headers, ...sample].map(r => r.map(safe).join(",")).join("\r\n");
  const csv = "\uFEFF" + rows; // BOM for Excel Arabic
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "guest-template.csv";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("تم تنزيل النموذج");
}

/** Strip CSV-injection prefixes and control chars from imported cell values. */
function sanitizeCell(v: string): string {
  let s = (v || "").toString().replace(/[\u0000-\u001F\u007F]/g, "").trim();
  // Drop leading formula chars to neutralize CSV injection
  while (s && /^[=+\-@]/.test(s)) s = s.slice(1).trim();
  // strip angle brackets to neutralize naive XSS payloads
  s = s.replace(/[<>]/g, "");
  return s;
}

/** Convert an ISO string to the value format expected by <input type="datetime-local">. */
function toLocalInput(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}

function EditCoordinatorDialog({ row, onClose, onSaved }: { row: CoordinatorRow | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (row) { setName(row.name); setUsername(row.username); setPassword(""); setShow(false); }
  }, [row]);

  const submit = async () => {
    if (!row) return;
    if (password && password.length < 6) { toast.error("كلمة المرور لا تقل عن 6 أحرف"); return; }
    setSaving(true);
    try {
      await updateCoordinator({
        data: {
          id: row.id,
          name: name.trim() || undefined,
          username: username.trim() || undefined,
          password: password || undefined,
        },
      });
      toast.success("تم تحديث المنسق");
      onSaved(); onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر التحديث");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={!!row} onOpenChange={v => !v && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>تعديل بيانات المنسق</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>الاسم</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>اسم المستخدم</Label><Input value={username} onChange={e => setUsername(e.target.value)} dir="ltr" /></div>
          <div>
            <Label>كلمة مرور جديدة (اتركها فارغة لعدم التغيير)</Label>
            <div className="flex items-center gap-2">
              <Input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} dir="ltr" />
              <Button type="button" variant="outline" size="icon" onClick={() => setShow(s => !s)}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving} className="gold-gradient text-primary-foreground">{saving ? "..." : "حفظ"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Per-event Integrations ---------------- */
function EventIntegrationsTab({ eventId }: { eventId: string }) {
  const [cfg, setCfg] = useState<WhatsAppConfig>(DEFAULT_WA_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const tplRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCfg(getWhatsAppConfig(eventId));
    setLoaded(true);
  }, [eventId]);

  const save = () => {
    saveWhatsAppConfig(
      { ...cfg, message_template: sanitizeTemplate(cfg.message_template || DEFAULT_WA_TEMPLATE) },
      eventId,
    );
    toast.success("تم حفظ إعدادات هذه الفعالية");
  };

  const insertTag = (tag: string) => {
    const el = tplRef.current;
    const current = cfg.message_template || "";
    if (!el) { setCfg({ ...cfg, message_template: current + tag }); return; }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + tag + current.slice(end);
    setCfg({ ...cfg, message_template: next });
    requestAnimationFrame(() => { el.focus(); const pos = start + tag.length; el.setSelectionRange(pos, pos); });
  };

  const preview = applyTemplate(cfg.message_template || DEFAULT_WA_TEMPLATE, {
    title: "المكرم", name: "محمد بن سعيد", url: "https://da3wa-card.lovable.app/i/abc123",
  });

  const isConfigured = Boolean(cfg.api_key && cfg.instance_id);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold sm:text-xl">WhatsApp</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">إعدادات خاصة بهذه الفعالية فقط</p>
            </div>
          </div>
          {loaded ? (
            <Badge variant={isConfigured ? "default" : "outline"} className={isConfigured ? "bg-emerald-500 text-white" : ""}>
              <ShieldCheck className="ms-1 h-3 w-3" /> {isConfigured ? "مفعّل" : "غير مفعّل"}
            </Badge>
          ) : null}
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>المزود</Label>
            <Select value={cfg.provider} onValueChange={(v) => setCfg({ ...cfg, provider: v as WhatsAppConfig["provider"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ultramsg">UltraMsg</SelectItem>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="meta">Meta Cloud API</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>مفتاح API</Label>
            <Input type="password" value={cfg.api_key} onChange={(e) => setCfg({ ...cfg, api_key: e.target.value })} placeholder="sk_live_xxx" autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label>معرّف الاتصال (Instance ID / Account SID)</Label>
            <Input value={cfg.instance_id} onChange={(e) => setCfg({ ...cfg, instance_id: e.target.value })} placeholder="instance123" />
          </div>
          <div className="space-y-2">
            <Label>رقم المُرسِل (اختياري)</Label>
            <Input value={cfg.sender} onChange={(e) => setCfg({ ...cfg, sender: e.target.value })} placeholder="+9665XXXXXXXX" dir="ltr" />
          </div>
          <Button onClick={save} className="w-full gold-gradient text-primary-foreground">
            <Save className="ms-2 h-4 w-4" /> حفظ
          </Button>
          <p className="text-xs text-muted-foreground">يتم حفظ هذه الإعدادات محلياً لهذه الفعالية فقط ولا تظهر في فعالياتك الأخرى.</p>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600">
            <Tag className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold sm:text-xl">قالب الرسالة</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">خاص بهذه الفعالية</p>
          </div>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {["[اللقب]", "[اسم_الضيف]", "[رابط_الدعوة]"].map(t => (
            <Button key={t} type="button" variant="outline" size="sm" onClick={() => insertTag(t)}>{t}</Button>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => setCfg({ ...cfg, message_template: DEFAULT_WA_TEMPLATE })}>إعادة للنص الافتراضي</Button>
        </div>
        <Textarea ref={tplRef} rows={6} value={cfg.message_template || ""} onChange={(e) => setCfg({ ...cfg, message_template: e.target.value.slice(0, 1000) })} placeholder={DEFAULT_WA_TEMPLATE} />
        <p className="mt-1 text-xs text-muted-foreground">الحد الأقصى 1000 حرف.</p>
        <div className="mt-5">
          <WhatsAppMobilePreview message={preview} />
        </div>
        <Button onClick={save} className="mt-4 w-full gold-gradient text-primary-foreground">
          <Save className="ms-2 h-4 w-4" /> حفظ القالب
        </Button>
      </Card>
    </div>
  );
}

/* ---------------- Delete Event ---------------- */
function DeleteEventDialog({ event, onDeleted }: { event: EventRow; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const submit = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      // Cascade-delete dependent rows first to avoid FK constraint failures.
      await supabase.from("guests").delete().eq("event_id", event.id);
      await supabase.from("coordinators").delete().eq("event_id", event.id);
      const { error } = await supabase.from("events").delete().eq("id", event.id);
      if (error) throw error;
      toast.success("تم حذف الفعالية");
      onDeleted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر الحذف");
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="ms-2 h-4 w-4" /> حذف الفعالية
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> تأكيد حذف الفعالية
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>هذا الإجراء <span className="font-bold text-destructive">لا يمكن التراجع عنه</span>. سيتم حذف:</p>
          <ul className="list-inside list-disc text-muted-foreground">
            <li>الفعالية: <span className="font-bold">{event.name}</span></li>
            <li>جميع المدعوين وبيانات الحضور</li>
            <li>جميع حسابات المنسقين المرتبطة</li>
          </ul>
          <div className="space-y-2">
            <Label>اكتب اسم الفعالية للتأكيد</Label>
            <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder={event.name} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button variant="destructive" disabled={deleting || confirmText.trim() !== event.name.trim()} onClick={submit}>
            {deleting ? "جارٍ الحذف..." : "حذف نهائي"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Delete All Guests ---------------- */
function DeleteAllGuestsDialog({ eventId, count, onDeleted }: { eventId: string; count: number; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from("guests").delete().eq("event_id", eventId);
      if (error) throw error;
      toast.success("تم حذف جميع المدعوين");
      onDeleted();
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر الحذف");
    } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!count} className="border-destructive/40 text-destructive hover:bg-destructive/10">
          <Trash2 className="ms-2 h-4 w-4" /> حذف جميع الضيوف
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> تأكيد حذف جميع المدعوين
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm">سيتم حذف <span className="font-bold">{count}</span> مدعو نهائياً مع كل ردودهم وملاحظاتهم. لا يمكن التراجع عن هذا الإجراء.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button variant="destructive" disabled={busy} onClick={submit}>{busy ? "جارٍ الحذف..." : "حذف الكل"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Wishes wall (congratulations + apologies) ---------------- */
function WishesWallTab({ guests }: { guests: Guest[] }) {
  const wished = useMemo(
    () => guests.filter(g => (g.notes || "").trim().length > 0),
    [guests],
  );
  const declinedWithWishes = wished.filter(g => g.rsvp_status === "declined");
  const otherWithNotes = wished.filter(g => g.rsvp_status !== "declined");

  if (wished.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Heart className="mx-auto h-10 w-10 text-gold" />
        <p className="mt-3 font-display text-lg font-bold">لا توجد تبريكات بعد</p>
        <p className="mt-1 text-sm text-muted-foreground">
          ستظهر هنا كل التبريكات والاعتذارات الراقية التي يرسلها المدعوون.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {declinedWithWishes.length > 0 ? (
        <section>
          <h3 className="mb-3 font-display text-lg font-bold">اعتذارات وتبريكات ({declinedWithWishes.length})</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {declinedWithWishes.map(g => {
              const { title, name } = splitTitleName(g.name);
              return (
                <Card key={g.id} className="relative overflow-hidden border-gold/40 bg-gradient-to-br from-amber-50/40 via-card to-card p-5">
                  <Heart className="absolute -right-3 -top-3 h-16 w-16 rotate-12 text-gold/15" />
                  <p className="font-display text-base font-bold text-gold">{title ? `${title} ` : ""}{name}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {g.notes}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
      {otherWithNotes.length > 0 ? (
        <section>
          <h3 className="mb-3 font-display text-lg font-bold">ملاحظات وتهاني أخرى ({otherWithNotes.length})</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {otherWithNotes.map(g => {
              const { title, name } = splitTitleName(g.name);
              return (
                <Card key={g.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-base font-bold">{title ? `${title} ` : ""}{name}</p>
                    <Badge variant="outline" className="text-[10px]">{RSVP_LABELS[g.rsvp_status]}</Badge>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {g.notes}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

