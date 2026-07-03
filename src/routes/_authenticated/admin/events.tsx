import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { assignEventOwner, listAllUsers } from "@/lib/admin.functions";
import { toast } from "sonner";
import { formatArabicDate } from "@/lib/event-utils";

export const Route = createFileRoute("/_authenticated/admin/events")({
  ssr: false,
  head: () => ({ meta: [{ title: "الفعاليات — INVITLY" }] }),
  component: EventsAdmin,
});

type EventRow = { id: string; name: string; event_date: string; owner_user_id: string | null };
type UserRow = { id: string; email: string; roles: string[] };

function EventsAdmin() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [owners, setOwners] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: ev }, users] = await Promise.all([
      supabase.from("events").select("id,name,event_date,owner_user_id").order("event_date", { ascending: true }),
      listAllUsers().catch(() => []),
    ]);
    setEvents((ev as EventRow[]) ?? []);
    setOwners(((users as UserRow[]) ?? []).filter((u) => u.roles.includes("owner")));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const assign = async (event_id: string, owner_user_id: string | null) => {
    setBusy(event_id);
    try {
      await assignEventOwner({ data: { event_id, owner_user_id } });
      toast.success("تم التحديث");
      await load();
    } catch (e) {
      toast.error("فشل التحديث", { description: (e as Error).message });
    } finally { setBusy(""); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">إسناد مالكي الفعاليات</h1>
        <p className="mt-2 text-muted-foreground">امنح كل فعالية مالكاً يستطيع الاطلاع على إحصائياتها فقط.</p>
      </div>
      <Card className="overflow-hidden p-0">
        {loading ? <p className="p-6 text-muted-foreground">جاري التحميل...</p> : events.length === 0 ? (
          <p className="p-6 text-muted-foreground">لا توجد فعاليات.</p>
        ) : (
          <div className="divide-y divide-border">
            {events.map((ev) => (
              <div key={ev.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{ev.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{formatArabicDate(ev.event_date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={ev.owner_user_id ?? ""} onChange={(e) => assign(ev.id, e.target.value || null)} disabled={busy === ev.id} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                    <option value="">بدون مالك</option>
                    {owners.map((o) => (<option key={o.id} value={o.id}>{o.email}</option>))}
                  </select>
                  {ev.owner_user_id && (
                    <Button size="sm" variant="outline" disabled={busy === ev.id} onClick={() => assign(ev.id, null)}>إزالة</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {owners.length === 0 && !loading && (
          <p className="border-t border-border p-3 text-center text-[11px] text-muted-foreground">
            لا يوجد مستخدمون بدور «مالك فعالية» بعد — أنشئ حساباً من صفحة المستخدمين ثم امنحه دور مالك.
          </p>
        )}
      </Card>
    </div>
  );
}