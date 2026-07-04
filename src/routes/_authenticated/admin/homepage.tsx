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
    const items = (Array.isArray(d.items) ? d.items : []) as Array<{ title: string; desc: string }>;
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
        <ArrayEditor
          items={items}
          onChange={(v) => set("items", v)}
          newItem={() => ({ title: "ميزة", desc: "الوصف" })}
          render={(item, upd) => (
            <div className="grid gap-2">
              <Input placeholder="العنوان" value={item.title} onChange={(e) => upd({ ...item, title: e.target.value })} />
              <Textarea placeholder="الوصف" value={item.desc} onChange={(e) => upd({ ...item, desc: e.target.value })} />
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

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
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