import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { MessageCircle, Sparkles, PartyPopper, Gift, Star, Heart } from "lucide-react";
import {
  getSiteContent,
  type SiteContent,
  type SiteSection,
  type SiteTheme,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "INVITLY — دعوات فاخرة تليق بمناسباتكم" },
      {
        name: "description",
        content:
          "منصة INVITLY لإدارة الدعوات الفاخرة وتأكيد الحضور بلمسة زمرّدية ذهبية.",
      },
    ],
  }),
  loader: () => getSiteContent(),
  errorComponent: () => (
    <div dir="rtl" className="grid min-h-screen place-items-center text-muted-foreground">
      تعذر تحميل الصفحة.
    </div>
  ),
  notFoundComponent: () => (
    <div dir="rtl" className="grid min-h-screen place-items-center text-muted-foreground">
      الصفحة غير موجودة.
    </div>
  ),
  component: Index,
});

function Index() {
  const content = Route.useLoaderData() as SiteContent;
  const { sections, theme, branding } = content;
  const visible = [...sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-background text-foreground"
      style={themeVars(theme)}
    >
      {/* Ambient aurora */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <span
          className="blob blob-a top-[-12%] right-[-10%] h-[60vw] w-[60vw] max-h-[720px] max-w-[720px]"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${withAlpha(theme.emerald, 0.55)}, transparent 70%)`,
          }}
        />
        <span
          className="blob blob-b bottom-[-18%] left-[-12%] h-[65vw] w-[65vw] max-h-[760px] max-w-[760px]"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${withAlpha(theme.gold, 0.28)}, transparent 70%)`,
          }}
        />
      </div>

      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.siteName} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient font-display font-extrabold">
                {branding.siteName.slice(0, 1)}
              </span>
            )}
            <span className="font-display text-xl font-bold tracking-wide">{branding.siteName}</span>
          </div>
          <a
            href={`https://wa.me/${branding.whatsappNumber}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-[12px] font-semibold text-primary transition hover:bg-primary/20"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            تواصل عبر واتساب
          </a>
        </div>
      </header>

      <main>
        {visible.map((s) => (
          <SectionRenderer key={s.key} section={s} />
        ))}
      </main>

      <SiteFooter branding={branding} social={content.social} />
    </div>
  );
}

function SectionRenderer({ section }: { section: SiteSection }) {
  const d = section.data as Record<string, unknown>;

  if (section.type === "hero") {
    return (
      <section className="relative overflow-hidden">
        {/* Cartoon 3D floating decorations */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <span className="absolute left-[6%] top-[18%] grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground toon-shadow animate-float-y">
            <PartyPopper className="h-7 w-7" />
          </span>
          <span className="absolute right-[8%] top-[12%] grid h-16 w-16 place-items-center rounded-full gold-gradient text-primary-foreground toon-shadow animate-float-y-2">
            <Gift className="h-8 w-8" />
          </span>
          <span className="absolute right-[14%] bottom-[10%] grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground toon-shadow animate-wobble-3d">
            <Star className="h-6 w-6" />
          </span>
          <span className="absolute left-[10%] bottom-[16%] grid h-12 w-12 place-items-center rounded-full bg-card text-primary border-2 border-primary/40 toon-shadow animate-float-y">
            <Heart className="h-6 w-6" />
          </span>
        </div>
        <div className="relative mx-auto max-w-6xl px-5 py-20 text-center sm:py-28">
          {typeof d.eyebrow === "string" && d.eyebrow && (
            <span className="animate-pop-in inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/60 px-4 py-1.5 text-[11px] font-medium tracking-wide text-primary backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              {d.eyebrow}
            </span>
          )}
          <h1 className="animate-pop-in mt-6 font-display text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl md:text-6xl" style={{ animationDelay: "0.1s" }}>
            {str(d.title)}
          </h1>
          <p className="animate-pop-in mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg" style={{ animationDelay: "0.2s" }}>
            {str(d.subtitle)}
          </p>
          {typeof d.ctaHref === "string" && d.ctaHref && (
            <a
              href={d.ctaHref}
              target="_blank"
              rel="noreferrer noopener"
              className="animate-pop-in mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground toon-shadow transition hover:-translate-y-0.5 hover:scale-[1.03]"
              style={{ animationDelay: "0.3s" }}
            >
              <MessageCircle className="h-4 w-4" />
              {str(d.ctaLabel) || "تواصل"}
            </a>
          )}
        </div>
      </section>
    );
  }

  if (section.type === "stats") {
    const items = (Array.isArray(d.items) ? d.items : []) as Array<{ value: string; label: string }>;
    return (
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((it, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card/40 px-4 py-5 text-center backdrop-blur-md"
            >
              <p className="font-display text-2xl font-bold text-primary">{it.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{it.label}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "features") {
    const items = (Array.isArray(d.items) ? d.items : []) as Array<{ title: string; desc: string }>;
    return (
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10 text-center">
          {str(d.title) && <h2 className="font-display text-3xl font-bold sm:text-4xl">{str(d.title)}</h2>}
          {str(d.subtitle) && (
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {str(d.subtitle)}
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {items.map((it, i) => (
            <article
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-md transition hover:border-primary/50 hover:-translate-y-1 hover:shadow-2xl"
              style={{ transitionDuration: "300ms" }}
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl gold-gradient text-primary-foreground toon-shadow transition group-hover:rotate-6 group-hover:scale-110">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "cta") {
    return (
      <section className="mx-auto max-w-4xl px-5 py-20">
        <div className="rounded-3xl border border-primary/30 bg-card/60 p-10 text-center backdrop-blur-md">
          <h2 className="font-display text-3xl font-bold">{str(d.title)}</h2>
          {str(d.subtitle) && (
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">{str(d.subtitle)}</p>
          )}
          {typeof d.ctaHref === "string" && d.ctaHref && (
            <a
              href={d.ctaHref}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              {str(d.ctaLabel) || "تواصل"}
            </a>
          )}
        </div>
      </section>
    );
  }

  if (section.type === "text") {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        {str(d.title) && <h2 className="font-display text-2xl font-bold">{str(d.title)}</h2>}
        {str(d.body) && (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {str(d.body)}
          </p>
        )}
      </section>
    );
  }

  return null;
}

function themeVars(t: SiteTheme): React.CSSProperties {
  // Inject as CSS custom properties so Tailwind tokens (--primary, --accent,
  // --background, --foreground, --gold, --emerald-*) all reflect admin choices.
  const style: React.CSSProperties & Record<string, string> = {};
  if (isHex(t.primary)) {
    style["--primary"] = t.primary;
    style["--ring"] = t.primary;
    style["--sidebar-primary"] = t.primary;
  }
  if (isHex(t.accent)) {
    style["--accent"] = t.accent;
  }
  if (isHex(t.background)) {
    style["--background"] = t.background;
    style["--card"] = t.background;
    style["--popover"] = t.background;
  }
  if (isHex(t.foreground)) {
    style["--foreground"] = t.foreground;
    style["--card-foreground"] = t.foreground;
    style["--popover-foreground"] = t.foreground;
  }
  if (isHex(t.gold)) {
    style["--gold"] = t.gold;
    style["--gold-soft"] = t.gold;
  }
  if (isHex(t.emerald)) {
    style["--emerald-deep"] = t.emerald;
    style["--emerald-mid"] = t.emerald;
  }
  return style;
}

function isHex(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v);
}

function withAlpha(hex: string, a: number): string {
  if (!isHex(hex)) return "transparent";
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}