import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HostShell } from "@/components/host-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_TYPES } from "@/lib/event-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/events/new")({
  head: () => ({ meta: [{ title: "فعالية جديدة — دعوتي" }] }),
  component: NewEvent,
});

function NewEvent() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    event_type: "wedding",
    event_date: "",
    event_time: "20:00",
    location: "",
    location_url: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("غير مسجل");
      const date = new Date(`${form.event_date}T${form.event_time}`);
      const { data, error } = await supabase.from("events").insert({
        host_id: u.user.id,
        name: form.name,
        event_type: form.event_type,
        event_date: date.toISOString(),
        location: form.location || null,
        location_url: form.location_url || null,
        description: form.description || null,
      }).select().single();
      if (error) throw error;
      toast.success("تم إنشاء الفعالية");
      nav({ to: "/events/$eventId", params: { eventId: data.id } });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <HostShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 font-display text-3xl font-bold">فعالية جديدة</h1>
        <p className="mb-6 text-muted-foreground">املأ تفاصيل المناسبة لإنشاء صفحة الدعوة.</p>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label="اسم الفعالية" id="name">
              <Input id="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: زفاف أحمد و سارة" />
            </Field>
            <Field label="نوع الفعالية" id="type">
              <Select value={form.event_type} onValueChange={v => setForm({ ...form, event_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="تاريخ الفعالية" id="date">
                <Input id="date" type="date" required value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
              </Field>
              <Field label="وقت الفعالية" id="time">
                <Input id="time" type="time" required value={form.event_time} onChange={e => setForm({ ...form, event_time: e.target.value })} />
              </Field>
            </div>
            <Field label="المكان" id="loc">
              <Input id="loc" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="قاعة الفخامة - الرياض" />
            </Field>
            <Field label="رابط الموقع (Google Maps)" id="locurl">
              <Input id="locurl" type="url" value={form.location_url} onChange={e => setForm({ ...form, location_url: e.target.value })} placeholder="https://maps.google.com/..." />
            </Field>
            <Field label="وصف إضافي (اختياري)" id="desc">
              <Textarea id="desc" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Button type="submit" disabled={loading} className="w-full gold-gradient text-primary-foreground">
              {loading ? "..." : "إنشاء الفعالية"}
            </Button>
          </form>
        </Card>
      </div>
    </HostShell>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}