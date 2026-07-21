import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, MessageCircle } from "lucide-react";
import { getSiteContent, type SiteContent } from "@/lib/admin.functions";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "الأسعار والباقات — INVITLY" },
      { name: "description", content: "باقات INVITLY لإدارة الدعوات الرقمية الفاخرة بأسعار شفافة شاملة الضريبة." },
      { property: "og:title", content: "الأسعار والباقات — INVITLY" },
      { property: "og:description", content: "اختر الباقة المناسبة لمناسبتك — الأساسية، الاحترافية، أو VIP." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://da3wa-card.lovable.app/pricing" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://da3wa-card.lovable.app/pricing" }],
  }),
  loader: () => getSiteContent(),
  component: PricingPage,
});

function PricingPage() {
  const c = Route.useLoaderData() as SiteContent;
  const p = c.pricing;
  const wa = c.branding.whatsappNumber;

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <span
          className="absolute -top-40 -right-40 h-[70vw] max-h-[700px] w-[70vw] max-w-[700px] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.12 165 / 0.5), transparent 70%)" }}
        />
        <span
          className="absolute -bottom-40 -left-40 h-[60vw] max-h-[600px] w-[60vw] max-w-[600px] rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, oklch(0.75 0.15 85 / 0.4), transparent 70%)" }}
        />
      </div>

      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient font-display font-extrabold text-primary-foreground">i</span>
            <span className="font-display text-xl font-bold tracking-wide">{c.branding.siteName}</span>
          </Link>
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            تواصل واتساب
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">{p.eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-5xl">{p.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{p.subtitle}</p>
          <div className="mx-auto mt-6 lux-divider w-32" />
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {p.plans.map((plan) => (
            <article
              key={plan.id}
              className={
                "relative flex flex-col rounded-3xl border p-7 backdrop-blur-xl transition " +
                (plan.highlight
                  ? "border-primary/60 bg-primary/5 shadow-[0_20px_60px_-30px_rgba(200,162,74,0.5)]"
                  : "border-border/60 bg-card/40 hover:border-primary/40")
              }
            >
              {plan.highlight && (
                <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full gold-gradient px-3 py-1 text-[10px] font-bold tracking-wider text-primary-foreground">
                  <Sparkles className="h-3 w-3" /> الأكثر طلباً
                </span>
              )}
              <h2 className="font-display text-2xl font-bold">{plan.name}</h2>
              <p className="mt-2 text-xs text-muted-foreground">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">ر.س</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground/80">{plan.period} · شامل الضريبة</p>

              <ul className="mt-6 space-y-2.5 text-sm">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.ctaHref || `https://wa.me/${wa}`}
                target="_blank"
                rel="noreferrer noopener"
                className={
                  "mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition " +
                  (plan.highlight
                    ? "gold-gradient text-primary-foreground hover:opacity-90"
                    : "border border-border bg-background/50 text-foreground hover:border-primary/60")
                }
              >
                <MessageCircle className="h-4 w-4" />
                {plan.ctaLabel}
              </a>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground/80">{p.note}</p>

        <div className="mt-14 rounded-2xl border border-border/60 bg-card/30 p-6 text-center backdrop-blur-xl">
          <p className="font-display text-lg font-bold">تحتاج باقة مخصصة؟</p>
          <p className="mt-2 text-sm text-muted-foreground">
            نصمم عروضاً حسب حجم مناسبتك ومتطلباتك — تواصل معنا للحصول على عرض سعر خاص.
          </p>
          <a
            href={`https://wa.me/${wa}?text=%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%B9%D8%B1%D8%B6%20%D8%B3%D8%B9%D8%B1%20%D9%85%D8%AE%D8%B5%D8%B5`}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
          >
            <MessageCircle className="h-4 w-4" />
            اطلب عرض سعر مخصص
          </a>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground/70">
          الاسترجاع يخضع لـ
          {" "}
          <Link to="/refund" className="text-primary underline-offset-4 hover:underline">سياسة الاسترجاع</Link>
          {" "}
          والاستخدام يخضع لـ
          {" "}
          <Link to="/terms" className="text-primary underline-offset-4 hover:underline">الشروط والأحكام</Link>.
        </p>
      </main>

      <SiteFooter branding={c.branding} social={c.social} />
    </div>
  );
}