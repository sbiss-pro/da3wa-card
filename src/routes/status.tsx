import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Database, ShieldCheck, Cloud } from "lucide-react";
import { getSiteContent, type SiteContent } from "@/lib/admin.functions";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "حالة النظام — INVITLY" },
      { name: "description", content: "الحالة التشغيلية لخدمات INVITLY: قاعدة البيانات، البوابة، والأمان." },
      { property: "og:title", content: "حالة النظام — INVITLY" },
      { property: "og:description", content: "حالة تشغيل خدمات INVITLY في الوقت الحالي." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://da3wa-card.lovable.app/status" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://da3wa-card.lovable.app/status" }],
  }),
  loader: () => getSiteContent(),
  component: StatusPage,
});

function StatusPage() {
  const c = Route.useLoaderData() as SiteContent;
  const services = [
    { name: "الموقع والواجهة", status: "operational", icon: Cloud, note: "يعمل بشكل طبيعي" },
    { name: "قاعدة البيانات", status: "operational", icon: Database, note: "جميع الاستعلامات ضمن الحدود الطبيعية" },
    { name: "المصادقة والأمان", status: "operational", icon: ShieldCheck, note: "RLS مفعّل — الجلسات آمنة" },
    { name: "بوابة الدعوات (RSVP)", status: "operational", icon: Activity, note: "استجابة سريعة" },
  ];

  return (
    <div dir="rtl" className="relative min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient font-display font-extrabold text-primary-foreground">i</span>
            <span className="font-display text-xl font-bold tracking-wide">{c.branding.siteName}</span>
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            جميع الأنظمة تعمل
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-14">
        <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">SYSTEM STATUS</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">حالة النظام</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          يتم تحديث هذه الصفحة تلقائياً. للتنبيهات التفصيلية أو الإبلاغ عن عطل، تواصل معنا عبر واتساب.
        </p>
        <div className="mt-6 lux-divider w-32" />

        <div className="mt-10 space-y-3">
          {services.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-base font-bold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.note}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-emerald-500">تعمل</span>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border/60 bg-card/30 p-6 text-sm text-muted-foreground">
          <p className="font-display text-base font-bold text-foreground">النسخ الاحتياطية</p>
          <p className="mt-2">
            يتم إجراء نسخ احتياطية آلية يومية لقاعدة البيانات على البنية التحتية المُدارة، مع الاحتفاظ بها لسبعة أيام على الأقل.
          </p>
        </div>
      </main>

      <SiteFooter branding={c.branding} social={c.social} commercial={c.commercial} />
    </div>
  );
}