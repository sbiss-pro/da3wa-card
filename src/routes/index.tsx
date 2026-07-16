import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { useEffect } from "react";
import {
  MessageCircle,
  Sparkles,
  Star,
  QrCode,
  Users,
  CalendarCheck,
  ScanLine,
  Send,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { WhatsAppSimulator } from "@/components/whatsapp-simulator";
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
      { property: "og:title", content: "INVITLY — دعوات فاخرة تليق بمناسباتكم" },
      { property: "og:description", content: "منصة INVITLY لإدارة الدعوات الفاخرة وتأكيد الحضور بلمسة زمرّدية ذهبية." },
      { property: "og:url", content: "https://da3wa-card.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://da3wa-card.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "INVITLY",
          url: "https://da3wa-card.lovable.app/",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "INVITLY",
          url: "https://da3wa-card.lovable.app/",
        }),
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
  const showWhatsapp = content.whatsapp.visible !== false;
  const visible = [...sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  // Scroll reveal — attaches "reveal-in" once elements enter the viewport.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window) || els.length === 0) {
      els.forEach((el) => el.classList.add("reveal-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [visible.length]);

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-background text-foreground"
      style={themeVars(theme)}
    >
      {/* Ambient aurora */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <span
          className="blob blob-a top-[-12%] right-[-10%] h-[70vw] w-[70vw] max-h-[720px] max-w-[720px]"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${withAlpha(theme.emerald, 0.55)}, transparent 70%)`,
          }}
        />
        <span
          className="blob blob-b bottom-[-18%] left-[-12%] h-[75vw] w-[75vw] max-h-[760px] max-w-[760px]"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${withAlpha(theme.gold, 0.28)}, transparent 70%)`,
          }}
        />
        <span
          className="blob blob-c top-[30%] left-[40%] h-[40vw] w-[40vw] max-h-[420px] max-w-[420px]"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${withAlpha(theme.gold, 0.14)}, transparent 70%)`,
          }}
        />
        {/* Faint dotted grid — adds depth without noise */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.siteName} className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full gold-gradient font-display font-extrabold">
                {branding.siteName.slice(0, 1)}
              </span>
            )}
            <span className="font-display truncate text-lg font-bold tracking-wide sm:text-xl">{branding.siteName}</span>
          </div>
          <a
            href={`https://wa.me/${branding.whatsappNumber}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-primary/20 sm:px-4 sm:text-[12px]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="hidden xs:inline sm:inline">تواصل عبر واتساب</span>
            <span className="xs:hidden sm:hidden">واتساب</span>
          </a>
        </div>
      </header>

      <main>
        {visible.map((s) => (
          <SectionRenderer key={s.key} section={s} />
        ))}

        {/* Marquee trust band — endless scroll */}
        <TrustMarquee />

        {showWhatsapp ? (
          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
              <div className="reveal text-center lg:text-right">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/60 px-4 py-1.5 text-[11px] font-medium tracking-wide text-primary backdrop-blur-md">
                  <MessageCircle className="h-3 w-3" />
                  الرسالة كما يستلمها ضيفك
                </span>
                <h2 className="font-hero mt-5 text-fluid-h2">
                  دعوة واحدة — كاملة، أنيقة، بلمسة شخصية
                </h2>
                <p className="font-body-luxe mx-auto mt-4 max-w-lg text-fluid-body text-muted-foreground lg:mx-0">
                  رسالة واحدة تحمل صورة بطاقتك، اسم ضيفك، وزر مباشر لفتح الدعوة —
                  دون روابط مزعجة أو عبارات دعائية.
                </p>
                <ul className="font-body-luxe mt-6 grid gap-2 text-[13px] text-foreground/85 lg:justify-items-start">
                  <li className="flex items-center justify-center gap-2 lg:justify-start">
                    <Star className="h-3.5 w-3.5 text-primary" /> صورة الدعوة تظهر تلقائياً
                  </li>
                  <li className="flex items-center justify-center gap-2 lg:justify-start">
                    <Star className="h-3.5 w-3.5 text-primary" /> رابط مختصر ومخفي داخل زر أنيق
                  </li>
                  <li className="flex items-center justify-center gap-2 lg:justify-start">
                    <Star className="h-3.5 w-3.5 text-primary" /> أزرار قبول / اعتذار / الموقع
                  </li>
                </ul>
              </div>
              <div className="reveal grid place-items-center" style={{ transitionDelay: "0.15s" }}>
                <WhatsAppSimulator
                  senderName={content.whatsapp.senderName}
                  imageUrl={content.whatsapp.imageUrl}
                  initialMessage={content.whatsapp.initialMessage}
                  eventDetails={{
                    day: content.whatsapp.eventDay,
                    date: content.whatsapp.eventDate,
                    time: content.whatsapp.eventTime,
                    location: content.whatsapp.eventLocation,
                    locationUrl: content.whatsapp.eventLocationUrl,
                  }}
                />
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter branding={branding} social={content.social} />
    </div>
  );
}

function TrustMarquee() {
  const items = [
    { icon: MessageCircle, label: "إرسال عبر واتساب" },
    { icon: QrCode, label: "بطاقة QR فاخرة" },
    { icon: CalendarCheck, label: "تأكيد الحضور" },
    { icon: Users, label: "المرافقون" },
    { icon: ScanLine, label: "مسح عند الاستقبال" },
    { icon: Send, label: "رسائل شخصية" },
    { icon: ShieldCheck, label: "خصوصية عالية" },
    { icon: Sparkles, label: "لمسة ذهبية" },
  ];
  const row = [...items, ...items];
  return (
    <section aria-hidden className="reveal relative overflow-hidden border-y border-border/40 bg-card/30 py-4 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap px-4 text-muted-foreground">
        {row.map((it, i) => (
          <span key={i} className="flex items-center gap-2 text-[12px] sm:text-sm">
            <it.icon className="h-4 w-4 text-primary" />
            {it.label}
            <span className="mx-2 text-primary/40">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}

function SectionRenderer({ section }: { section: SiteSection }) {
  const d = section.data as Record<string, unknown>;

  if (section.type === "hero") {
    return (
      <section className="relative overflow-hidden">
        {/* Decorative spinning ring — pure CSS, no images */}
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 -z-10 hidden -translate-x-1/2 md:block">
          <div className="animate-spin-slow h-[520px] w-[520px] rounded-full border border-primary/10" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 sm:py-24">
          {/* Bento grid hero: main title tile + accent tiles */}
          <div className="grid gap-3 sm:gap-4 md:grid-cols-6 md:grid-rows-[auto_auto]">
            {/* Primary tile — headline */}
            <div className="animate-pop-in tilt-hover relative overflow-hidden rounded-3xl border border-primary/25 bg-card/50 p-6 backdrop-blur-md sm:p-8 md:col-span-4 md:row-span-2 md:p-12">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(circle at 20% 10%, rgba(201,168,76,0.18), transparent 55%), radial-gradient(circle at 90% 90%, rgba(201,168,76,0.10), transparent 60%)",
                }}
              />
              {/* Corner shimmer */}
              <span aria-hidden className="lux-shimmer pointer-events-none absolute inset-0 opacity-40" />
              <div className="relative">
                {typeof d.eyebrow === "string" && d.eyebrow && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/40 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-primary sm:text-[11px]">
                    <Sparkles className="h-3 w-3" />
                    {d.eyebrow}
                  </span>
                )}
                <h1 className="font-hero mt-5 text-fluid-hero tracking-tight break-words">
                  {str(d.title)}
                </h1>
                <p className="font-body-luxe mt-5 max-w-xl text-fluid-body text-muted-foreground">
                  {str(d.subtitle)}
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  {typeof d.ctaHref === "string" && d.ctaHref && (
                    <a
                      href={d.ctaHref}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground toon-shadow transition hover:-translate-y-0.5 hover:scale-[1.03] sm:px-7"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {str(d.ctaLabel) || "تواصل"}
                    </a>
                  )}
                  <a
                    href="#features"
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-transparent px-5 py-3 text-sm font-medium text-primary transition hover:bg-primary/10"
                  >
                    استكشف المزايا
                    <ChevronDown className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Accent tile 1 */}
            <div className="animate-pop-in tilt-hover group relative overflow-hidden rounded-3xl border border-primary/20 bg-card/40 p-5 backdrop-blur-md sm:p-6 md:col-span-2" style={{ animationDelay: "0.1s" }}>
              <QrCode className="mb-3 h-6 w-6 text-primary transition group-hover:scale-110" />
              <p className="font-hero text-2xl text-primary sm:text-3xl">فاخرة</p>
              <p className="font-body-luxe mt-2 text-[12px] leading-relaxed text-muted-foreground sm:text-xs">
                بطاقات مصمّمة بلمسة ذهبية تعكس رقي مناسبتك، بدون قوالب مكرّرة.
              </p>
            </div>

            {/* Accent tile 2 */}
            <div className="animate-pop-in tilt-hover group relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-5 sm:p-6 md:col-span-2" style={{ animationDelay: "0.2s" }}>
              <ScanLine className="mb-3 h-6 w-6 text-primary transition group-hover:scale-110" />
              <p className="font-hero text-2xl sm:text-3xl">إدارة كاملة</p>
              <p className="font-body-luxe mt-2 text-[12px] leading-relaxed text-muted-foreground sm:text-xs">
                إرسال عبر واتساب، تأكيد الحضور، ومسح QR للاستقبال — بلوحة واحدة.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (section.type === "stats") {
    const items = (Array.isArray(d.items) ? d.items : []) as Array<{ value: string; label: string }>;
    return (
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="reveal grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((it, i) => (
            <div
              key={i}
              className="tilt-hover rounded-2xl border border-border/60 bg-card/40 px-3 py-4 text-center backdrop-blur-md sm:px-4 sm:py-5"
              style={{ transitionDelay: `${i * 0.05}s` }}
            >
              <p className="font-display text-xl font-bold text-primary sm:text-2xl">{it.value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{it.label}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "features") {
    const items = (Array.isArray(d.items) ? d.items : []) as Array<{
      title: string;
      desc: string;
      iconColor?: string;
      iconFg?: string;
    }>;
    const defaultIconBg = isHex(str(d.iconColor)) ? str(d.iconColor) : "";
    return (
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="reveal mb-8 text-center sm:mb-10">
          {str(d.title) && <h2 className="font-hero text-fluid-h2">{str(d.title)}</h2>}
          {str(d.subtitle) && (
            <p className="mx-auto mt-3 max-w-lg text-fluid-body text-muted-foreground">
              {str(d.subtitle)}
            </p>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
          {items.map((it, i) => {
            const bg = isHex(it.iconColor) ? it.iconColor! : defaultIconBg;
            const fg = isHex(it.iconFg) ? it.iconFg! : bg ? contrastOn(bg) : "";
            const iconStyle: React.CSSProperties = bg
              ? { background: bg, color: fg }
              : {};
            return (
            <article
              key={i}
              className="reveal tilt-hover group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-md hover:border-primary/50 hover:shadow-2xl sm:p-6"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-2xl transition group-hover:opacity-100"
              />
              <div
                className={`mb-4 grid h-11 w-11 place-items-center rounded-xl toon-shadow transition group-hover:rotate-6 group-hover:scale-110 ${
                  bg ? "" : "gold-gradient text-primary-foreground"
                }`}
                style={iconStyle}
              >
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold break-words">{it.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground break-words sm:text-sm">{it.desc}</p>
            </article>
            );
          })}
        </div>
      </section>
    );
  }

  if (section.type === "cta") {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="reveal relative overflow-hidden rounded-3xl border border-primary/30 bg-card/60 p-6 text-center backdrop-blur-md sm:p-10">
          <span aria-hidden className="lux-shimmer pointer-events-none absolute inset-0" />
          <div className="relative">
            <h2 className="font-hero text-fluid-h2">{str(d.title)}</h2>
            {str(d.subtitle) && (
              <p className="mx-auto mt-3 max-w-lg text-fluid-body text-muted-foreground">{str(d.subtitle)}</p>
            )}
            {typeof d.ctaHref === "string" && d.ctaHref && (
              <a
                href={d.ctaHref}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground toon-shadow transition hover:-translate-y-0.5 hover:scale-[1.03]"
              >
                <MessageCircle className="h-4 w-4" />
                {str(d.ctaLabel) || "تواصل"}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (section.type === "text") {
    return (
      <section className="reveal mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-16">
        {str(d.title) && <h2 className="font-hero text-fluid-h2">{str(d.title)}</h2>}
        {str(d.body) && (
          <p className="mt-4 whitespace-pre-line text-fluid-body text-muted-foreground">
            {str(d.body)}
          </p>
        )}
      </section>
    );
  }

  return null;
}

function themeVars(t: SiteTheme): React.CSSProperties {
  const style: React.CSSProperties & Record<string, string> = {};
  if (isHex(t.primary)) {
    style["--primary"] = t.primary;
    style["--ring"] = t.primary;
    style["--sidebar-primary"] = t.primary;
    style["--primary-foreground"] = contrastOn(t.primary);
  }
  if (isHex(t.accent)) {
    style["--accent"] = t.accent;
    style["--accent-foreground"] = contrastOn(t.accent);
  }
  if (isHex(t.background)) {
    style["--background"] = t.background;
    style["--card"] = t.background;
    style["--popover"] = t.background;
    const fg = isHex(t.foreground) ? t.foreground : contrastOn(t.background);
    style["--foreground"] = fg;
    style["--card-foreground"] = fg;
    style["--popover-foreground"] = fg;
    style["--muted-foreground"] = mixHex(fg, t.background, 0.65);
  }
  if (isHex(t.foreground) && !isHex(t.background)) {
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

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function contrastOn(hex: string): string {
  if (!isHex(hex)) return "#ffffff";
  const [r, g, b] = hexToRgb(hex);
  // Relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0b1220" : "#ffffff";
}

function mixHex(a: string, b: string, weightA: number): string {
  if (!isHex(a) || !isHex(b)) return a;
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const w = Math.min(1, Math.max(0, weightA));
  const r = Math.round(ar * w + br * (1 - w));
  const g = Math.round(ag * w + bg * (1 - w));
  const bl = Math.round(ab * w + bb * (1 - w));
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
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