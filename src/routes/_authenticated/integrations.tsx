import { createFileRoute, Link } from "@tanstack/react-router";
import { HostShell } from "@/components/host-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plug, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({ meta: [{ title: "التكاملات — INVITLY" }] }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  return (
    <HostShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">التكاملات</h1>
        <p className="text-muted-foreground">أصبحت إعدادات التكاملات الآن خاصة بكل فعالية على حدة.</p>
      </div>
      <Card className="max-w-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
            <Plug className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold">إعدادات لكل فعالية</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              يمكنك الآن إعداد بيانات WhatsApp وقالب الرسالة بشكل مستقل لكل فعالية من تبويب <span className="font-bold text-foreground">«التكاملات»</span> داخل صفحة الفعالية. هذا يتيح استخدام مزوّدات وحسابات وقوالب رسائل مختلفة لكل مناسبة.
            </p>
            <Link to="/dashboard">
              <Button className="mt-4 gold-gradient text-primary-foreground"><ArrowLeft className="ms-2 h-4 w-4" /> العودة إلى اللوحة لاختيار فعالية</Button>
            </Link>
          </div>
        </div>
      </Card>
    </HostShell>
  );
}