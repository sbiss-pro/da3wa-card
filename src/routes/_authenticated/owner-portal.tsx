import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMyOwnedEvents, type OwnerEventStats } from "@/lib/owner.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatArabicDate, eventTypeLabel } from "@/lib/event-utils";
import { Calendar, LogOut, Users, CheckCircle2, XCircle, Clock, ScanLine, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/owner-portal")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة المالك — INVITLY" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    try {
      const events = (await getMyOwnedEvents()) as OwnerEventStats[];
      return { events };
    } catch {
      throw redirect({ to: "/" });
    }
  },
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const { events } = Route.useRouteContext() as { events: OwnerEventStats[] };
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const grandTotals = events.reduce(
    (a, e) => ({
      invitations: a.invitations + e.totals.invitations,
      confirmed: a.confirmed + e.totals.confirmed,
      declined: a.declined + e.totals.declined,
      pending: a.pending + e.totals.pending,
      checked_in: a.checked_in + e.totals.checked_in,
    }),
    { invitations: 0, confirmed: 0, declined: 0, pending: 0, checked_in: 0 },
  );

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient text-primary-foreground">
              <Eye className="h-4 w-4" />
            </span>
            <div>
              <p className="font-display text-lg font-bold">لوحة مالك الفعالية</p>
              <p className="text-[11px] text-muted-foreground">عرض للقراءة فقط · {email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="ms-1 h-4 w-4" /> خروج
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {events.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            لا توجد فعاليات مُسنَدة إلى حسابك بعد.
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Stat icon={Users} label="الدعوات" value={grandTotals.invitations} />
              <Stat icon={CheckCircle2} label="مؤكدون" value={grandTotals.confirmed} />
              <Stat icon={XCircle} label="اعتذر" value={grandTotals.declined} />
              <Stat icon={Clock} label="بانتظار الرد" value={grandTotals.pending} />
              <Stat icon={ScanLine} label="حضور فعلي" value={grandTotals.checked_in} />
            </div>

            <h2 className="mt-10 mb-4 font-display text-xl font-bold">فعالياتك</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {events.map((e) => (
                <Card key={e.event_id} className="p-6">
                  <div className="mb-1 inline-block rounded-full bg-accent/30 px-3 py-1 text-xs">
                    {eventTypeLabel(e.event_type)}
                  </div>
                  <h3 className="font-display text-lg font-bold">{e.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> {formatArabicDate(e.event_date)}
                  </p>
                  <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
                    <Mini label="دعوات" value={e.totals.invitations} />
                    <Mini label="مؤكد" value={e.totals.confirmed} />
                    <Mini label="اعتذر" value={e.totals.declined} />
                    <Mini label="انتظار" value={e.totals.pending} />
                    <Mini label="حضور" value={e.totals.checked_in} />
                  </div>
                </Card>
              ))}
            </div>

            <p className="mt-8 text-center text-[11px] text-muted-foreground">
              هذه اللوحة للاطلاع فقط — لا يمكنك التعديل أو الإضافة أو الحذف.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold">{value}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-lg gold-gradient text-primary-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-display font-bold">{value}</p>
    </div>
  );
}