import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HostShell } from "@/components/host-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Calendar as CalIcon, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { eventTypeLabel, formatArabicDate } from "@/lib/event-utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "لوحة التحكم — دعوتي" }] }),
  component: Dashboard,
});

type EventRow = { id: string; name: string; event_type: string; event_date: string; location: string | null; slug: string };

function Dashboard() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: e } = await supabase.from("events").select("id,name,event_type,event_date,location,slug").order("event_date", { ascending: true });
      const evs = (e || []) as EventRow[];
      setEvents(evs);
      if (evs.length) {
        const { data: g } = await supabase.from("guests").select("event_id").in("event_id", evs.map(x => x.id));
        const c: Record<string, number> = {};
        (g || []).forEach((row: { event_id: string }) => { c[row.event_id] = (c[row.event_id] || 0) + 1; });
        setCounts(c);
      }
      setLoading(false);
    })();
  }, []);

  const upcoming = events.filter(e => new Date(e.event_date) > new Date()).length;
  const total = events.length;
  const guests = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <HostShell>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">إدارة فعالياتك ومدعويك</p>
        </div>
        <Link to="/events/new"><Button className="gold-gradient text-primary-foreground"><Plus className="ms-1 h-4 w-4" /> فعالية جديدة</Button></Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={CalIcon} label="إجمالي الفعاليات" value={total} />
        <StatCard icon={TrendingUp} label="فعاليات قادمة" value={upcoming} />
        <StatCard icon={Users} label="إجمالي المدعوين" value={guests} />
      </div>

      <h2 className="mb-4 mt-10 font-display text-xl font-bold">فعالياتك</h2>
      {loading ? (
        <p className="text-muted-foreground">جاري التحميل...</p>
      ) : events.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">لا توجد فعاليات بعد. ابدأ بإنشاء فعاليتك الأولى!</p>
          <Link to="/events/new" className="mt-4 inline-block"><Button className="gold-gradient text-primary-foreground">إنشاء فعالية</Button></Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map(ev => (
            <Link key={ev.id} to="/events/$eventId" params={{ eventId: ev.id }}>
              <Card className="group h-full p-6 transition hover:border-primary hover:shadow-lg">
                <div className="mb-2 inline-block rounded-full bg-accent/30 px-3 py-1 text-xs text-accent-foreground">{eventTypeLabel(ev.event_type)}</div>
                <h3 className="font-display text-xl font-bold">{ev.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{formatArabicDate(ev.event_date)}</p>
                {ev.location ? <p className="mt-1 text-xs text-muted-foreground">{ev.location}</p> : null}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">المدعوين</span>
                  <span className="font-bold text-gold">{counts[ev.id] || 0}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </HostShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof CalIcon; label: string; value: number }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold">{value}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-xl gold-gradient text-primary-foreground">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}