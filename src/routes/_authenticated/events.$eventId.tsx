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
import { InvitationCard, type TemplateConfig } from "@/components/invitation-card";
import { RSVP_LABELS, RSVP_COLORS, formatArabicDate, eventTypeLabel } from "@/lib/event-utils";
import { Upload, Plus, Trash2, Save, Link as LinkIcon, Copy, Search, ScanLine, Bell, MailCheck, MessageCircle, UserCog } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ErrorBoundary } from "@/components/error-boundary";
import { getWhatsAppConfig, simulateWhatsAppBlast, normalizePhone } from "@/lib/whatsapp";
import { listCoordinators, createCoordinator, deleteCoordinator } from "@/lib/coordinator.functions";

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
};

const PRESETS = [
  { name: "ذهبي كلاسيكي", config: { template: "gold", bg_color: "#f7f1e6", text_color: "#1a1410", accent_color: "#c9a24a", font: "amiri" } },
  { name: "أسود فاخر", config: { template: "noir", bg_color: "#0d0d0d", text_color: "#f5f0e0", accent_color: "#d4af37", font: "amiri" } },
  { name: "وردي ناعم", config: { template: "rose", bg_color: "#fdf2f4", text_color: "#3a2e2a", accent_color: "#c9a0a8", font: "tajawal" } },
  { name: "أخضر زيتي", config: { template: "olive", bg_color: "#f5f7f0", text_color: "#2b3624", accent_color: "#6b7f5a", font: "amiri" } },
];

function EventDetails() {
  const { eventId } = Route.useParams();
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
        <Button variant="outline" onClick={() => {
          navigator.clipboard.writeText(`${window.location.origin}/e/${event.slug}`);
          toast.success("تم نسخ رابط الفعالية");
        }}>
          <LinkIcon className="ms-2 h-4 w-4" /> نسخ رابط الفعالية
        </Button>
      </div>

      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">بطاقة الدعوة</TabsTrigger>
          <TabsTrigger value="guests">المدعوون ({guests.length})</TabsTrigger>
          <TabsTrigger value="rsvp">تتبع الردود</TabsTrigger>
          <TabsTrigger value="automation">التذكيرات</TabsTrigger>
          <TabsTrigger value="coordinators">المنسقون</TabsTrigger>
          <TabsTrigger value="scanner">مسح QR</TabsTrigger>
        </TabsList>

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
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><Label>الخلفية</Label><Input type="color" value={cfg.bg_color || "#f7f1e6"} onChange={e => setCfg({ ...cfg, bg_color: e.target.value })} /></div>
            <div className="space-y-2"><Label>النص</Label><Input type="color" value={cfg.text_color || "#1a1410"} onChange={e => setCfg({ ...cfg, text_color: e.target.value })} /></div>
            <div className="space-y-2"><Label>اللون المميز</Label><Input type="color" value={cfg.accent_color || "#c9a24a"} onChange={e => setCfg({ ...cfg, accent_color: e.target.value })} /></div>
          </div>
          <div className="space-y-2">
            <Label>الخط</Label>
            <Select value={cfg.font || "amiri"} onValueChange={v => setCfg({ ...cfg, font: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="amiri">أميري (كلاسيكي)</SelectItem>
                <SelectItem value="tajawal">تجوال (عصري)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>رابط صورة الخلفية (اختياري)</Label>
            <Input value={cfg.image_url || ""} onChange={e => setCfg({ ...cfg, image_url: e.target.value })} placeholder="https://..." />
          </div>
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
  const fileRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => guests.filter(g => g.name.toLowerCase().includes(q.toLowerCase()) || (g.phone || "").includes(q)), [guests, q]);
  const pageSize = 10;
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const handleFile = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const rows = res.data.map(r => {
          const keys = Object.keys(r);
          const k = (...names: string[]) => keys.find(x => names.some(n => x.toLowerCase().includes(n))) || "";
          return {
            event_id: event.id,
            name: r[k("name", "اسم")] || "",
            phone: r[k("phone", "هاتف", "جوال")] || null,
            email: r[k("email", "بريد", "ايميل")] || null,
          };
        }).filter(r => r.name);
        if (!rows.length) return toast.error("لم يتم العثور على مدعوين");
        const { error } = await supabase.from("guests").insert(rows);
        if (error) toast.error(error.message); else { toast.success(`تم استيراد ${rows.length} مدعو`); reload(); }
      },
    });
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا المدعو؟")) return;
    await supabase.from("guests").delete().eq("id", id);
    toast.success("تم الحذف");
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => { setQ(e.target.value); setPage(0); }} placeholder="بحث بالاسم أو الهاتف..." className="ps-3 pe-9" />
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,text/csv" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="ms-2 h-4 w-4" /> استيراد Excel/CSV</Button>
          <AddGuestDialog eventId={event.id} onAdded={reload} />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>المرافقون</TableHead>
              <TableHead>الدعوة</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">لا يوجد مدعوون</TableCell></TableRow>
            ) : paged.map(g => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{g.phone || "—"}</TableCell>
                <TableCell><Badge style={{ background: RSVP_COLORS[g.rsvp_status], color: "#fff" }}>{RSVP_LABELS[g.rsvp_status]}</Badge></TableCell>
                <TableCell className="text-center">{g.companions_count}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(inviteUrl(g.token)); toast.success("تم النسخ"); }}>
                    <Copy className="ms-1 h-3 w-3" /> نسخ
                  </Button>
                </TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const submit = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("guests").insert({ event_id: eventId, name, phone: phone || null, email: email || null });
    if (error) toast.error(error.message); else { toast.success("تمت الإضافة"); setName(""); setPhone(""); setEmail(""); setOpen(false); onAdded(); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gold-gradient text-primary-foreground"><Plus className="ms-1 h-4 w-4" /> إضافة مدعو</Button></DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>إضافة مدعو</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>الاسم</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>رقم الهاتف</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <div><Label>البريد الإلكتروني (اختياري)</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={submit} className="gold-gradient text-primary-foreground">إضافة</Button></DialogFooter>
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
            const token = decoded.includes("/i/") ? decoded.split("/i/")[1].split(/[?#]/)[0] : decoded;
            const { data: guest } = await supabase.from("guests").select("*").eq("token", token).eq("event_id", eventId).single();
            if (!guest) { toast.error("لم يتم التعرف على المدعو"); return; }
            await supabase.from("guests").update({ rsvp_status: "attended", checked_in_at: new Date().toISOString() }).eq("id", guest.id);
            setLastGuest({ ...guest, rsvp_status: "attended" } as Guest);
            toast.success(`أهلاً ${guest.name}`);
            onCheckIn();
          },
          () => {},
        );
      } catch (e) {
        console.error(e);
        toast.error("تعذر فتح الكاميرا");
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