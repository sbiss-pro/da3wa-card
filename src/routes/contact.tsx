import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone, Twitter, Instagram, ChevronLeft } from "lucide-react";
import { getSiteContent, type SiteContent } from "@/lib/admin.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — INVITLY" },
      { name: "description", content: "تواصل مع فريق INVITLY لأي استفسار أو طلب دعم." },
      { property: "og:title", content: "تواصل معنا — INVITLY" },
      { property: "og:description", content: "تواصل مع فريق INVITLY لأي استفسار أو طلب دعم." },
      { property: "og:url", content: "https://da3wa-card.lovable.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://da3wa-card.lovable.app/contact" }],
  }),
  loader: () => getSiteContent(),
  component: ContactPage,
});

function ContactPage() {
  const c = Route.useLoaderData() as SiteContent;
  const p = c.pages.contact;
  const s = c.social;
  const wa = c.branding.whatsappNumber;
  const channels = [
    wa && { icon: MessageCircle, label: "واتساب", value: `+${wa}`, href: `https://wa.me/${wa}` },
    s.email && { icon: Mail, label: "البريد الإلكتروني", value: s.email, href: `mailto:${s.email}` },
    s.phone && { icon: Phone, label: "الهاتف", value: s.phone, href: `tel:${s.phone}` },
    s.twitter && { icon: Twitter, label: "تويتر", value: s.twitter.replace(/^https?:\/\//, ""), href: s.twitter },
    s.instagram && { icon: Instagram, label: "انستقرام", value: s.instagram.replace(/^https?:\/\//, ""), href: s.instagram },
  ].filter(Boolean) as Array<{ icon: typeof Mail; label: string; value: string; href: string }>;

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient font-display font-extrabold text-primary-foreground">i</span>
            <span className="font-display text-xl font-bold tracking-wide">{c.branding.siteName}</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">
            الرئيسية
            <ChevronLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-14">
        <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">{p.eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{p.title}</h1>
        {p.subtitle && <p className="mt-3 max-w-xl text-sm text-muted-foreground">{p.subtitle}</p>}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {channels.map((ch) => (
            <a
              key={ch.label}
              href={ch.href}
              target="_blank"
              rel="noreferrer"
              className="group rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-md transition hover:border-primary/50 hover:bg-card/70"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl gold-gradient">
                <ch.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <p className="font-display text-sm font-bold">{ch.label}</p>
              <p className="mt-1 text-xs text-muted-foreground break-all">{ch.value}</p>
            </a>
          ))}
        </div>

        {p.body && (
          <div className="mt-12 whitespace-pre-line rounded-3xl border border-primary/30 bg-card/40 p-8 text-sm leading-relaxed text-muted-foreground backdrop-blur-md">
            {p.body}
          </div>
        )}
      </main>
    </div>
  );
}
