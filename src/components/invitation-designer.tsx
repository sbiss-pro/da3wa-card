import { useRef, useState } from "react";
import { InvitationCard, type TemplateConfig } from "@/components/invitation-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Move, RotateCcw } from "lucide-react";

type Item = { key: string; label: string };
const ITEMS: Item[] = [
  { key: "eyebrow",  label: "العنوان العلوي" },
  { key: "title",    label: "عنوان الفعالية" },
  { key: "greeting", label: "جملة الترحيب" },
  { key: "message",  label: "رسالة الدعوة" },
  { key: "date",     label: "التاريخ" },
  { key: "location", label: "المكان" },
  { key: "timeline", label: "الجدول الزمني" },
];

export function InvitationDesigner({
  config, setConfig, eventName, eventDate, location,
}: {
  config: TemplateConfig;
  setConfig: (c: TemplateConfig) => void;
  eventName: string;
  eventDate: string;
  location?: string | null;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ key: string; offX: number; offY: number } | null>(null);
  const [active, setActive] = useState<string>("eyebrow");

  const setPos = (key: string, x: number, y: number) => {
    const positions = { ...(config.positions || {}) };
    positions[key] = { x: clamp(x), y: clamp(y) };
    setConfig({ ...config, positions });
  };

  const onPointerDown = (key: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cur = config.positions?.[key];
    const startX = cur?.x ?? 50;
    const startY = cur?.y ?? 50;
    const px = (e.clientX - rect.left) / rect.width * 100;
    const py = (e.clientY - rect.top) / rect.height * 100;
    dragRef.current = { key, offX: px - startX, offY: py - startY };
    setActive(key);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current; if (!d) return;
    const rect = stageRef.current?.getBoundingClientRect(); if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width * 100;
    const py = (e.clientY - rect.top) / rect.height * 100;
    setPos(d.key, px - d.offX, py - d.offY);
  };
  const onPointerUp = () => { dragRef.current = null; };

  const labels = config.labels || {};
  const setLabel = (k: keyof NonNullable<TemplateConfig["labels"]>, v: string) =>
    setConfig({ ...config, labels: { ...labels, [k]: v } });

  const resetPositions = () => setConfig({ ...config, positions: {} });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/20 p-3">
        <div className="mb-3 flex items-center justify-between">
          <Label className="flex items-center gap-2"><Move className="h-4 w-4 text-gold" /> النصوص القابلة للتعديل</Label>
          <Button type="button" variant="ghost" size="sm" onClick={resetPositions}>
            <RotateCcw className="ms-1 h-3 w-3" /> إعادة التوزيع
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">العنوان العلوي</Label>
            <Input value={labels.eyebrow ?? ""} placeholder="دعوة كريمة"
              onChange={e => setLabel("eyebrow", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">جملة الترحيب</Label>
            <Input value={labels.greeting_prefix ?? ""} placeholder="يسرّنا دعوتك يا"
              onChange={e => setLabel("greeting_prefix", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">نص التاريخ (اختياري)</Label>
            <Input value={labels.date_override ?? ""} placeholder="اتركه فارغاً لاستخدام التاريخ الفعلي"
              onChange={e => setLabel("date_override", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">نص المكان (اختياري)</Label>
            <Input value={labels.location_override ?? ""} placeholder="اتركه فارغاً لاستخدام المكان الفعلي"
              onChange={e => setLabel("location_override", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          اسحب أي عنصر فوق البطاقة لإعادة تموضعه. سيتم حفظ مواقعه عند ضغط «حفظ التصميم».
        </p>
        <div
          ref={stageRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="relative touch-none select-none"
          style={{ aspectRatio: "3 / 4", maxWidth: 560 }}
        >
          <div className="absolute inset-0">
            <InvitationCard
              config={config}
              eventName={eventName}
              eventDate={eventDate}
              location={location}
              guestName="ضيفنا الكريم"
            />
          </div>
          {/* drag handles overlay */}
          {ITEMS.map(it => {
            const p = config.positions?.[it.key];
            if (!p) return null;
            return (
              <button
                key={it.key}
                type="button"
                onPointerDown={onPointerDown(it.key)}
                onClick={() => setActive(it.key)}
                className={`absolute z-10 cursor-grab rounded-md border bg-card/90 px-2 py-0.5 text-[10px] font-medium shadow active:cursor-grabbing ${active === it.key ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
                style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
                aria-label={`اسحب ${it.label}`}
              >
                {it.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {ITEMS.map(it => {
            const enabled = !!config.positions?.[it.key];
            return (
              <Button
                key={it.key}
                type="button"
                size="sm"
                variant={enabled ? "default" : "outline"}
                onClick={() => {
                  if (enabled) {
                    const positions = { ...(config.positions || {}) };
                    delete positions[it.key];
                    setConfig({ ...config, positions });
                  } else {
                    setPos(it.key, 50, 50);
                    setActive(it.key);
                  }
                }}
              >
                {enabled ? "إزالة موضع " : "إضافة موضع "}{it.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function clamp(n: number) { return Math.max(2, Math.min(98, n)); }