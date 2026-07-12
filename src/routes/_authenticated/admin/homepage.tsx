import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  getSiteContent,
  updateSiteContent,
  type SiteContent,
  type SiteSection,
  type SiteTheme,
  type SiteBranding,
  type SiteSocial,
  type SitePages,
  type SitePage,
  type SiteWhatsApp,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/homepage")({
  ssr: false,
  head: () => ({ meta: [{ title: "تحرير الصفحة الرئيسية — INVITLY" }] }),
  component: HomepageEditor,
});

function HomepageEditor() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    getSiteContent().then((c) => setContent(c as SiteContent));
  }, []);

  const save = async () => {
    if (!content) return;
    setSaving(true);
    try {
      await updateSiteContent({ data: { content } });
      toast.success("تم الحفظ بنجاح");
      setPreviewKey((k) => k + 1);
    } catch (e) {
      toast.error("تعذر الحفظ", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (!content) {
    return <p className="text-muted-foreground">جاري التحميل...</p>;
  }

  const setSections = (sections: SiteSection[]) =>
    setContent({ ...content, sections: sections.map((s, i) => ({ ...s, order: i })) });
  const setTheme = (theme: SiteTheme) => setContent({ ...content, theme });
  const setBranding = (branding: SiteBranding) => setContent({ ...content, branding });
  const setSocial = (social: SiteSocial) => setContent({ ...content, social });
  const setPages = (pages: SitePages) => setContent({ ...content, pages });
  const setWhatsapp = (whatsapp: SiteWhatsApp) => setContent({ ...content, whatsapp });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">تحرير الصفحة الرئيسية</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            جميع التغييرات تُطبَّق على الصفحة الرئيسية بعد الحفظ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewKey((k) => k + 1)}>
            <RefreshCw className="ms-1 h-4 w-4" /> تحديث المعاينة
          </Button>
          <Button size="sm" className="gold-gradient text-primary-foreground" disabled={saving} onClick={save}>
            <Save className="ms-1 h-4 w-4" /> {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sections" className="w-full">
        <TabsList>
          <TabsTrigger value="sections">الأقسام</TabsTrigger>
          <TabsTrigger value="theme">الألوان</TabsTrigger>
          <TabsTrigger value="branding">العلامة</TabsTrigger>
          <TabsTrigger value="social">الفوتر</TabsTrigger>
          <TabsTrigger value="pages">الصفحات</TabsTrigger>
          <TabsTrigger value="whatsapp">محاكي واتساب</TabsTrigger>
          <TabsTrigger value="preview">معاينة</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="mt-6 space-y-4">
          <SectionsEditor sections={content.sections} onChange={setSections} />
        </TabsContent>

        <TabsContent value="theme" className="mt-6">
          <ThemeEditor theme={content.theme} onChange={setTheme} />
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <BrandingEditor branding={content.branding} onChange={setBranding} />
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <SocialEditor social={content.social} onChange={setSocial} />
        </TabsContent>

        <TabsContent value="pages" className="mt-6">
          <PagesEditor pages={content.pages} onChange={setPages} />
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsappEditor whatsapp={content.whatsapp} onChange={setWhatsapp} />
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card className="overflow-hidden p-0">
            <iframe
              key={previewKey}
              src="/"
              title="معاينة"
              className="h-[70vh] w-full bg-background"
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SectionsEditor({
  sections,
  onChange,
}: {
  sections: SiteSection[];
  onChange: (s: SiteSection[]) => void;
}) {
  const sorted = useMemo(() => [...sections].sort((a, b) => a.order - b.order), [sections]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sorted];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  const updateAt = (idx: number, patch: Partial<SiteSection>) => {
    const next = [...sorted];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const remove = (idx: number) => onChange(sorted.filter((_, i) => i !== idx));
  const add = (type: SiteSection["type"]) => {
    onChange([
      ...sorted,
      {
        key: `${type}-${Date.now()}`,
        type,
        visible: true,
        order: sorted.length,
        data: defaultDataFor(type),
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">إضافة قسم:</span>
        {(["hero", "stats", "features", "cta", "text"] as const).map((t) => (
          <Button key={t} size="sm" variant="outline" onClick={() => add(t)}>
            <Plus className="ms-1 h-3.5 w-3.5" /> {sectionLabel(t)}
          </Button>
        ))}
      </div>

      {sorted.map((s, idx) => (
        <Card key={s.key} className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold">
                {sectionLabel(s.type)}
              </span>
              <span className="text-xs text-muted-foreground">#{idx + 1}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="flex items-center gap-2 text-xs">
                <Switch
                  checked={s.visible}
                  onCheckedChange={(v) => updateAt(idx, { visible: v })}
                />
                {s.visible ? "ظاهر" : "مخفي"}
              </Label>
              <Button size="icon" variant="ghost" onClick={() => move(idx, -1)}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => move(idx, 1)}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(idx)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <SectionDataForm section={s} onChange={(data) => updateAt(idx, { data })} />
        </Card>
      ))}
    </div>
  );
}

function SectionDataForm({
  section,
  onChange,
}: {
  section: SiteSection;
  onChange: (d: SiteSection["data"]) => void;
}) {
  const d = section.data as Record<string, unknown>;
  const set = (k: string, v: unknown) => onChange({ ...d, [k]: v } as SiteSection["data"]);

  if (section.type === "hero" || section.type === "cta") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {section.type === "hero" && (
          <Field label="نص علوي صغير (eyebrow)">
            <Input value={str(d.eyebrow)} onChange={(e) => set("eyebrow", e.target.value)} />
          </Field>
        )}
        <Field label="العنوان">
          <Input value={str(d.title)} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="النص الفرعي" className="md:col-span-2">
          <Textarea value={str(d.subtitle)} onChange={(e) => set("subtitle", e.target.value)} />
        </Field>
        <Field label="نص الزر">
          <Input value={str(d.ctaLabel)} onChange={(e) => set("ctaLabel", e.target.value)} />
        </Field>
        <Field label="رابط الزر">
          <Input value={str(d.ctaHref)} onChange={(e) => set("ctaHref", e.target.value)} />
        </Field>
      </div>
    );
  }

  if (section.type === "stats") {
    const items = (Array.isArray(d.items) ? d.items : []) as Array<{ value: string; label: string }>;
    return (
      <ArrayEditor
        items={items}
        onChange={(v) => set("items", v)}
        newItem={() => ({ value: "٠", label: "تسمية" })}
        render={(item, upd) => (
          <div className="grid gap-2 md:grid-cols-2">
            <Input placeholder="القيمة" value={item.value} onChange={(e) => upd({ ...item, value: e.target.value })} />
            <Input placeholder="التسمية" value={item.label} onChange={(e) => upd({ ...item, label: e.target.value })} />
          </div>
        )}
      />
    );
  }

  if (section.type === "features") {
    const items = (Array.isArray(d.items) ? d.items : []) as Array<{
      title: string;
      desc: string;
      iconColor?: string;
      iconFg?: string;
    }>;
    return (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="العنوان">
            <Input value={str(d.title)} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="النص الفرعي">
            <Input value={str(d.subtitle)} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
        </div>
        <Field label="لون الأيقونات الافتراضي (يطبَّق على كل بطاقة لم تُخصَّص) — اتركه فارغاً لاستخدام الذهبي التلقائي">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={str(d.iconColor) || "#c8a24a"}
              onChange={(e) => set("iconColor", e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-border bg-background"
            />
            <Input
              placeholder="#c8a24a"
              value={str(d.iconColor)}
              onChange={(e) => set("iconColor", e.target.value)}
              className="font-mono"
            />
            {str(d.iconColor) && (
              <Button size="sm" variant="ghost" onClick={() => set("iconColor", "")}>
                إعادة تعيين
              </Button>
            )}
          </div>
        </Field>
        <ArrayEditor<{ title: string; desc: string; iconColor?: string; iconFg?: string }>
          items={items}
          onChange={(v) => set("items", v)}
          newItem={() => ({ title: "ميزة", desc: "الوصف" })}
          render={(item, upd) => (
            <div className="grid gap-2">
              <Input placeholder="العنوان" value={item.title} onChange={(e) => upd({ ...item, title: e.target.value })} />
              <Textarea placeholder="الوصف" value={item.desc} onChange={(e) => upd({ ...item, desc: e.target.value })} />
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-[11px] text-muted-foreground">لون خلفية الأيقونة</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={item.iconColor || "#c8a24a"}
                      onChange={(e) => upd({ ...item, iconColor: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded border border-border bg-background"
                    />
                    <Input
                      placeholder="افتراضي"
                      value={item.iconColor || ""}
                      onChange={(e) => upd({ ...item, iconColor: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-[11px] text-muted-foreground">لون الأيقونة نفسها</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={item.iconFg || "#ffffff"}
                      onChange={(e) => upd({ ...item, iconFg: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded border border-border bg-background"
                    />
                    <Input
                      placeholder="تلقائي حسب التباين"
                      value={item.iconFg || ""}
                      onChange={(e) => upd({ ...item, iconFg: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      </div>
    );
  }

  // text
  return (
    <div className="grid gap-3">
      <Field label="العنوان">
        <Input value={str(d.title)} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="النص">
        <Textarea rows={5} value={str(d.body)} onChange={(e) => set("body", e.target.value)} />
      </Field>
    </div>
  );
}

function ArrayEditor<T>({
  items,
  onChange,
  newItem,
  render,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  newItem: () => T;
  render: (item: T, upd: (v: T) => void) => React.ReactNode;
}) {
  const upd = (idx: number, v: T) => onChange(items.map((it, i) => (i === idx ? v : it)));
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {items.map((it, idx) => (
        <div key={idx} className="flex items-start gap-2 rounded-lg border border-border p-3">
          <div className="flex-1">{render(it, (v) => upd(idx, v))}</div>
          <div className="flex flex-col gap-1">
            <Button size="icon" variant="ghost" onClick={() => move(idx, -1)}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => move(idx, 1)}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => remove(idx)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...items, newItem()])}>
        <Plus className="ms-1 h-3.5 w-3.5" /> إضافة عنصر
      </Button>
    </div>
  );
}

function ThemeEditor({ theme, onChange }: { theme: SiteTheme; onChange: (t: SiteTheme) => void }) {
  const set = (k: keyof SiteTheme, v: string) => onChange({ ...theme, [k]: v });
  const fields: Array<{ key: keyof SiteTheme; label: string }> = [
    { key: "primary", label: "اللون الأساسي" },
    { key: "accent", label: "لون التمييز" },
    { key: "gold", label: "الذهبي" },
    { key: "emerald", label: "الزمرّدي" },
    { key: "background", label: "لون الخلفية" },
    { key: "foreground", label: "لون النص" },
  ];
  return (
    <Card className="p-6">
      <div className="mb-6">
        <Label className="mb-2 block text-xs font-semibold text-muted-foreground">
          ثيمات جاهزة — اضغط لتطبيق الألوان على جميع صفحات الموقع
        </Label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => onChange(p.theme)}
              className="group flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3 text-start transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <div className="flex -space-x-1 rtl:space-x-reverse">
                {[p.theme.background, p.theme.primary, p.theme.accent, p.theme.gold].map((c, i) => (
                  <span
                    key={i}
                    className="h-7 w-7 rounded-full border-2 border-background shadow"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">{p.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          تطبيق الثيم يحدّث القيم في الحقول أدناه — اضغط "حفظ التغييرات" أعلى الصفحة لتفعيله على الموقع.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-border bg-background"
              />
              <Input value={theme[f.key]} onChange={(e) => set(f.key, e.target.value)} className="font-mono" />
            </div>
          </Field>
        ))}
      </div>
    </Card>
  );
}

const THEME_PRESETS: Array<{ name: string; desc: string; theme: SiteTheme }> = [
  {
    name: "زمرّدي وذهبي",
    desc: "الفخامة العربية الكلاسيكية",
    theme: { primary: "#0f3d2e", accent: "#c8a24a", gold: "#c8a24a", emerald: "#0f3d2e", background: "#faf7f0", foreground: "#111827" },
  },
  {
    name: "ملكي أزرق",
    desc: "أناقة رسمية بلمسة ذهبية",
    theme: { primary: "#1e3a8a", accent: "#fbbf24", gold: "#fbbf24", emerald: "#1e3a8a", background: "#f8fafc", foreground: "#0f172a" },
  },
  {
    name: "وردي وذهبي",
    desc: "رومانسي ناعم للأعراس",
    theme: { primary: "#be185d", accent: "#f59e0b", gold: "#f59e0b", emerald: "#be185d", background: "#fdf2f8", foreground: "#1f2937" },
  },
  {
    name: "أسود وفضّي",
    desc: "عصري وفخم",
    theme: { primary: "#e5e7eb", accent: "#9ca3af", gold: "#d1d5db", emerald: "#374151", background: "#0a0a0a", foreground: "#f9fafb" },
  },
  {
    name: "بيج ونحاسي",
    desc: "دافئ وتقليدي",
    theme: { primary: "#7c2d12", accent: "#b45309", gold: "#d97706", emerald: "#7c2d12", background: "#f5f0e6", foreground: "#1c1917" },
  },
  {
    name: "بنفسجي ملكي",
    desc: "جريء وفاخر",
    theme: { primary: "#7c3aed", accent: "#f0abfc", gold: "#e9d5ff", emerald: "#7c3aed", background: "#1a0b2e", foreground: "#faf5ff" },
  },
  {
    name: "زيتوني ذهبي",
    desc: "طبيعي وهادئ",
    theme: { primary: "#3d4a2a", accent: "#d4af37", gold: "#d4af37", emerald: "#3d4a2a", background: "#f7f5ec", foreground: "#1c1917" },
  },
  {
    name: "تركوازي ومرجاني",
    desc: "منعش وحيوي",
    theme: { primary: "#0d9488", accent: "#fb7185", gold: "#f59e0b", emerald: "#0d9488", background: "#f0fdfa", foreground: "#134e4a" },
  },
];

function BrandingEditor({
  branding,
  onChange,
}: {
  branding: SiteBranding;
  onChange: (b: SiteBranding) => void;
}) {
  const set = (k: keyof SiteBranding, v: string) => onChange({ ...branding, [k]: v });
  return (
    <Card className="p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="اسم الموقع">
          <Input value={branding.siteName} onChange={(e) => set("siteName", e.target.value)} />
        </Field>
        <Field label="رقم واتساب (بدون +)">
          <Input
            value={branding.whatsappNumber}
            onChange={(e) => set("whatsappNumber", e.target.value.replace(/[^0-9]/g, ""))}
          />
        </Field>
        <Field label="رابط الشعار (اختياري)" className="md:col-span-2">
          <Input value={branding.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} />
        </Field>
      </div>
    </Card>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SocialEditor({ social, onChange }: { social: SiteSocial; onChange: (s: SiteSocial) => void }) {
  const set = (k: keyof SiteSocial, v: string) => onChange({ ...social, [k]: v });
  const fields: Array<{ key: keyof SiteSocial; label: string; placeholder: string }> = [
    { key: "twitter", label: "رابط تويتر", placeholder: "https://twitter.com/..." },
    { key: "instagram", label: "رابط انستقرام", placeholder: "https://instagram.com/..." },
    { key: "email", label: "البريد الإلكتروني", placeholder: "hello@example.com" },
    { key: "phone", label: "رقم الهاتف", placeholder: "+9661..." },
  ];
  return (
    <Card className="p-6">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            <Input dir="ltr" placeholder={f.placeholder} value={social[f.key]} onChange={(e) => set(f.key, e.target.value)} />
          </Field>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">تظهر هذه الروابط في فوتر الموقع وصفحة تواصل معنا. اترك الحقل فارغاً لإخفاء الأيقونة.</p>
    </Card>
  );
}

function PagesEditor({ pages, onChange }: { pages: SitePages; onChange: (p: SitePages) => void }) {
  const keys: Array<{ k: keyof SitePages; label: string }> = [
    { k: "about", label: "من نحن" },
    { k: "contact", label: "تواصل معنا" },
    { k: "privacy", label: "سياسة الخصوصية" },
    { k: "terms", label: "الشروط والأحكام" },
  ];
  return (
    <Tabs defaultValue="about" className="w-full">
      <TabsList>
        {keys.map((it) => (
          <TabsTrigger key={it.k} value={it.k}>{it.label}</TabsTrigger>
        ))}
      </TabsList>
      {keys.map((it) => (
        <TabsContent key={it.k} value={it.k} className="mt-4">
          <PageEditor
            page={pages[it.k]}
            onChange={(v) => onChange({ ...pages, [it.k]: v })}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function PageEditor({ page, onChange }: { page: SitePage; onChange: (p: SitePage) => void }) {
  const set = (k: keyof SitePage, v: string) => onChange({ ...page, [k]: v });
  return (
    <Card className="p-6">
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="نص علوي (eyebrow)">
            <Input value={page.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
          </Field>
          <Field label="العنوان">
            <Input value={page.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
        </div>
        <Field label="النص الفرعي">
          <Input value={page.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
        </Field>
        <Field label="محتوى الصفحة">
          <Textarea rows={14} value={page.body} onChange={(e) => set("body", e.target.value)} />
        </Field>
        <p className="text-xs text-muted-foreground">تدعم أسطر متعددة — كل سطر جديد سيظهر كما هو على الصفحة.</p>
      </div>
    </Card>
  );
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function WhatsappEditor({
  whatsapp,
  onChange,
}: {
  whatsapp: SiteWhatsApp;
  onChange: (w: SiteWhatsApp) => void;
}) {
  const set = (k: keyof SiteWhatsApp, v: string) => onChange({ ...whatsapp, [k]: v });
  return (
    <Card className="p-6">
      <p className="mb-4 text-xs text-muted-foreground">
        هذه القيم تظهر في محاكي الواتساب على الصفحة الرئيسية فقط.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="اسم المُرسِل (رأس المحادثة)">
          <Input value={whatsapp.senderName} onChange={(e) => set("senderName", e.target.value)} />
        </Field>
        <Field label="رابط صورة الدعوة">
          <Input dir="ltr" value={whatsapp.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
        </Field>
        <Field label="نص الرسالة الأولى" className="md:col-span-2">
          <Textarea rows={5} value={whatsapp.initialMessage} onChange={(e) => set("initialMessage", e.target.value)} />
        </Field>
        <Field label="اليوم (مثال: يوم الجمعة)">
          <Input value={whatsapp.eventDay} onChange={(e) => set("eventDay", e.target.value)} />
        </Field>
        <Field label="التاريخ">
          <Input value={whatsapp.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
        </Field>
        <Field label="الوقت">
          <Input value={whatsapp.eventTime} onChange={(e) => set("eventTime", e.target.value)} />
        </Field>
        <Field label="اسم الموقع">
          <Input value={whatsapp.eventLocation} onChange={(e) => set("eventLocation", e.target.value)} />
        </Field>
        <Field label="رابط الموقع (خرائط جوجل)" className="md:col-span-2">
          <Input dir="ltr" value={whatsapp.eventLocationUrl} onChange={(e) => set("eventLocationUrl", e.target.value)} />
        </Field>
      </div>
    </Card>
  );
}

function sectionLabel(t: SiteSection["type"]): string {
  return (
    { hero: "قسم رئيسي", stats: "إحصائيات", features: "المزايا", cta: "دعوة لإجراء", text: "نص حر", testimonials: "آراء", gallery: "معرض" } as const
  )[t];
}

function defaultDataFor(t: SiteSection["type"]): SiteSection["data"] {
  switch (t) {
    case "hero":
      return { eyebrow: "INVITLY", title: "عنوان رئيسي", subtitle: "وصف قصير", ctaLabel: "تواصل", ctaHref: "https://wa.me/966500000000" };
    case "stats":
      return { items: [{ value: "٠", label: "تسمية" }] };
    case "features":
      return { title: "المزايا", subtitle: "", items: [{ title: "ميزة", desc: "الوصف" }] };
    case "cta":
      return { title: "ابدأ الآن", subtitle: "", ctaLabel: "تواصل", ctaHref: "https://wa.me/966500000000" };
    case "text":
      return { title: "عنوان", body: "نص" };
    default:
      return {};
  }
}