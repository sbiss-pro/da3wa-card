import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  Clock,
  MessageCircle,
  QrCode,
  Sparkles,
  Sun,
  Moon,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "invitly — دعوات إلكترونية فاخرة لمناسبتك" },
      {
        name: "description",
        content:
          "احجز خدمة دعوات فاخرة لمناسبتك — بطاقة مخصصة، إرسال عبر واتساب، ولوحة تتابع فيها ردود ضيوفك.",
      },
    ],
  }),
  component: Index,
});

/* ─── tiny data ─── */
const designs = [
  {
    id: "emerald",
    label: "Emerald",
    sub: "ذهبي · داكن",
    bg: "from-[#0a1a15] to-[#061108]",
    accent: "text-[#C8A44A]",
    border: "border-[#C8A44A]/30",
  },
  {
    id: "rose",
    label: "Rose Gold",
    sub: "وردي · رومانسي",
    bg: "from-[#1a0a10] to-[#12060c]",
    accent: "text-[#f4a0b4]",
    border: "border-[#f4a0b4]/30",
  },
  {
    id: "royal",
    label: "Royal Blue",
    sub: "أزرق · ملكي",
    bg: "from-[#0a0d1a] to-[#06080f]",
    accent: "text-[#a0a8f4]",
    border: "border-[#a0a8f4]/30",
  },
  {
    id: "ivory",
    label: "Ivory",
    sub: "عاجي · كلاسيك",
    bg: "from-[#f5f0e8] to-[#ede8dc]",
    accent: "text-[#6B6352]",
    border: "border-[#6B6352]/20",
  },
  {
    id: "midnight",
    label: "Midnight",
    sub: "أزرق منتصف الليل",
    bg: "from-[#050510] to-[#0a0a1a]",
    accent: "text-[#c0c8f8]",
    border: "border-[#c0c8f8]/20",
  },
];

const guests = [
  { name: "أحمد محمد العمري", status: "قبِل", type: "yes" },
  { name: "فهد سعد الغامدي", status: "قبِل", type: "yes" },
  { name: "نورة خالد الزهراني", status: "اعتذرت", type: "no" },
  { name: "محمد عبدالله القحطاني", status: "لم يردّ", type: "wait" },
];

const steps = [
  { n: "١", title: "احجز الخدمة", desc: "أخبرنا بتفاصيل مناسبتك — التاريخ والمكان وعدد الضيوف" },
  { n: "٢", title: "اختر بطاقتك", desc: "تصفّح القوالب الفاخرة واختر ما يعجبك — نخصّصها لك" },
  { n: "٣", title: "نحن نرسل", desc: "نتولى إرسال الدعوات لجميع ضيوفك عبر واتساب" },
  { n: "٤", title: "تابع وأنت مرتاح", desc: "راقب الردود من لوحتك الخاصة في أي وقت" },
];

const plans = [
  {
    name: "أساسي",
    price: "١٩٩",
    period: "لمناسبة واحدة",
    features: ["حتى ١٠٠ ضيف", "بطاقة دعوة مخصصة", "إرسال عبر واتساب", "لوحة متابعة الردود"],
    off: ["تذكيرات قبل المناسبة", "تقرير الحضور الفعلي"],
    featured: false,
  },
  {
    name: "مميز",
    price: "٣٩٩",
    period: "لمناسبة واحدة",
    features: ["حتى ٣٠٠ ضيف", "بطاقة دعوة فاخرة مخصصة", "إرسال عبر واتساب", "لوحة متابعة كاملة", "تذكيرات تلقائية للضيوف", "تقرير الحضور الفعلي"],
    off: [],
    featured: true,
  },
  {
    name: "كبار المناسبات",
    price: "٦٩٩",
    period: "لمناسبة واحدة",
    features: ["ضيوف غير محدودين", "بطاقة دعوة حصرية", "إرسال عبر واتساب", "لوحة متابعة VIP", "تذكيرات ومتابعة يدوية", "تقرير PDF مفصّل"],
    off: [],
    featured: false,
  },
];

/* ─── component ─── */
function Index() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeDesign, setActiveDesign] = useState("emerald");

  useEffect(() => {
    const stored =
      (typeof window !== "undefined" &&
        (localStorage.getItem("theme") as "dark" | "light" | null)) ||
      "dark";
    setTheme(stored);
    document.documentElement.classList.toggle("light", stored === "light");
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* ignore */
      }
      document.documentElement.classList.toggle("light", next === "light");
      return next;
    });
  };

  const selected = designs.find((d) => d.id === activeDesign) ?? designs[0];

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient aurora */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <span
          className="blob blob-a top-[-12%] right-[-10%] h-[60vw] w-[60vw] max-h-[720px] max-w-[720px]"
          style={{ background: "radial-gradient(circle at 30% 30%, oklch(0.55 0.12 165 / 0.55), transparent 70%)" }}
        />
        <span
          className="blob blob-b bottom-[-18%] left-[-12%] h-[65vw] w-[65vw] max-h-[760px] max-w-[760px]"
          style={{ background: "radial-gradient(circle at 50% 50%, oklch(0.78 0.13 85 / 0.28), transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(oklch(0.88 0.08 88 / 0.6) 1px, transparent 1px)", backgroundSize: "26px 26px" }}
        />
      </div>

      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient font-display font-extrabold">
              د
            </span>
            <span className="font-display text-xl font-bold tracking-wide">invitly</span>
          </Link>
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
              <a href="#what-you-get" className="hover:text-foreground transition">ماذا ستحصل؟</a>
              <a href="#dashboard" className="hover:text-foreground transition">لوحة المتابعة</a>
              <a href="#pricing" className="hover:text-foreground transition">الأسعار</a>
            </nav>
            <button
              type="button"
              onClick={toggleTheme}
              className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card/50 text-foreground/80 transition hover:border-primary/60 hover:text-primary"
              aria-label="تبديل المظهر"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <Link
              to="/auth"
              className="group inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-[12px] font-semibold text-primary transition hover:bg-primary/20"
            >
              احجز دعوتك
              <ChevronLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:py-24 md:grid-cols-[1.1fr_1fr]">
          {/* Copy */}
          <div className="lux-fade-up text-center md:text-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/60 px-4 py-1.5 text-[11px] font-medium tracking-wide text-primary backdrop-blur-md">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              خدمة دعوات رقمية فاخرة
            </span>
            <h1 className="mt-7 font-display text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl md:text-6xl">
              مناسبتك تستحق
              <br />
              <span className="bg-gradient-to-l from-[oklch(0.92_0.08_88)] via-[oklch(0.82_0.12_85)] to-[oklch(0.7_0.14_82)] bg-clip-text text-transparent">
                دعوة تُبهر ضيوفك
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:mx-0 sm:text-lg">
              أنت تحتفل — نحن نتولى إرسال الدعوات وإدارة الضيوف.
              تابع من قبِل ومن اعتذر، واختر شكل بطاقتك الفاخرة.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-end">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                احجز دعوتك الآن
              </Link>
              <a
                href="#what-you-get"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                ماذا يشمل؟
                <ChevronLeft className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-8 lux-divider mx-auto w-40 md:mx-0" />
            <p className="mt-4 text-xs tracking-[0.18em] text-muted-foreground/70">
              EMERALD · CHAMPAGNE · 2026
            </p>
          </div>

          {/* Card mock */}
          <div className="relative mx-auto w-full max-w-sm lux-fade-up" style={{ animationDelay: "0.15s" }}>
            <div aria-hidden className="absolute -inset-6 rounded-[2rem] lux-ornament blur-xl opacity-70" />
            <div className="glass-card relative rounded-[1.75rem] p-7 text-center">
              {/* floating badge */}
              <div className="absolute -top-3 -right-3 flex items-center gap-1.5 rounded-full border border-primary/30 bg-card/80 px-3 py-1 text-[10px] font-semibold text-primary backdrop-blur-md shadow-lg">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                </span>
                ✦ دعوة وصلت لـ أحمد
              </div>
              <div className="mx-auto mb-3 h-px w-16 bg-primary/60" />
              <p className="font-display text-xs tracking-[0.4em] text-primary/80">INVITATION</p>
              <h3 className="mt-5 font-display text-3xl font-bold leading-tight">
                حفل زفاف
                <br />
                <span className="text-primary">سارة &amp; خالد</span>
              </h3>
              <p className="mt-3 text-xs text-muted-foreground">الجمعة · ١٢ ربيع الآخر</p>
              <div className="my-5 lux-divider" />
              <div className="grid grid-cols-3 gap-2 text-center tabular-nums">
                {[{ v: "٠٢", l: "يوم" }, { v: "٠٧", l: "ساعة" }, { v: "٤٤", l: "دقيقة" }].map((u) => (
                  <div key={u.l} className="rounded-xl border border-primary/20 bg-background/40 py-2">
                    <p className="font-display text-2xl font-bold text-primary">{u.v}</p>
                    <p className="text-[10px] text-muted-foreground">{u.l}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[11px] tracking-wider text-muted-foreground">
                ٠٨:٣٠ م · قاعة الماسة
              </p>
              <div className="mx-auto mt-4 h-px w-16 bg-primary/60" />
              {/* stat */}
              <div className="absolute -bottom-4 -left-4 rounded-xl border border-border bg-card/90 px-3 py-2 text-right shadow-xl backdrop-blur-md">
                <p className="text-lg font-bold text-primary leading-none">٢٣٦</p>
                <p className="text-[10px] text-muted-foreground">ضيفاً قبِل ✓</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mx-auto max-w-6xl px-5 pb-12">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { n: "+١٢ألف", l: "دعوة أُرسلت" },
              { n: "٩٧٪", l: "معدل وصول الدعوات" },
              { n: "+٥٠٠", l: "مناسبة سعيدة" },
              { n: "٤.٩", l: "تقييم أصحاب المناسبات" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-border/60 bg-card/40 px-4 py-4 text-center backdrop-blur-md"
              >
                <p className="font-display text-2xl font-bold text-primary">{s.n}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHAT YOU GET ═══ */}
      <section id="what-you-get" className="mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-12 text-center">
          <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">ماذا ستحصل عليه؟</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            أنت تحتفل —{" "}
            <span className="text-primary">نحن ندير كل شيء</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            من بطاقة الدعوة الفاخرة إلى معرفة من سيحضر — كل شيء في متناول يدك.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            { icon: Sparkles, title: "اختر شكل بطاقتك", desc: "تصفّح قوالب راقية وأخبرنا بالذي يعجبك — نخصّصها بأسمائكم وتفاصيل مناسبتكم." },
            { icon: BarChart3, title: "تابع من سيحضر", desc: "لوحة خاصة بك تُظهر لحظةً بلحظة من قبِل، من اعتذر، ومن لم تصله الدعوة بعد." },
            { icon: CheckCircle2, title: "اعرف الحضور الفعلي", desc: "بعد انتهاء المناسبة تحصل على تقرير كامل بمن حضر فعلاً ومن لم يأتِ." },
            { icon: MessageCircle, title: "دعواتك تصل عبر واتساب", desc: "كل ضيف يستقبل دعوته الفاخرة على واتساب — باسمه الشخصي ورمز QR خاص به." },
          ].map(({ icon: Icon, title, desc }) => (
            <article
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-md transition hover:border-primary/50 hover:bg-card/70"
            >
              <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
              <div className="relative">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl gold-gradient">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ═══ DASHBOARD PREVIEW ═══ */}
      <section id="dashboard" className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          {/* Screen mock */}
          <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-md">
            {/* header */}
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-sm font-bold">حفل زفاف سارة &amp; خالد</p>
              <p className="text-[10px] text-muted-foreground">الجمعة · ١٢ ربيع الآخر</p>
            </div>
            {/* counters */}
            <div className="mb-4 grid grid-cols-3 gap-2 text-center">
              {[
                { n: "٢٣٦", l: "قبِلوا", c: "text-green-400" },
                { n: "١٨", l: "اعتذروا", c: "text-red-400" },
                { n: "٤٤", l: "لم يردّوا", c: "text-primary" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-border/50 bg-background/40 py-3">
                  <p className={`font-display text-xl font-bold ${s.c}`}>{s.n}</p>
                  <p className="text-[10px] text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
            {/* bars */}
            {[
              { label: "نسبة القبول", val: 79, pct: "٧٩٪", color: "bg-green-400" },
              { label: "وصلتهم الدعوة", val: 98, pct: "٩٨٪", color: "bg-primary" },
            ].map((b) => (
              <div key={b.label} className="mb-3 rounded-xl border border-border/40 bg-background/30 px-3 py-2.5">
                <div className="mb-1.5 flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-semibold text-primary">{b.pct}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border/50">
                  <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.val}%` }} />
                </div>
              </div>
            ))}
            {/* guest list */}
            <div className="mt-3 flex flex-col gap-1.5">
              {guests.map((g) => (
                <div
                  key={g.name}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-background/20 px-3 py-1.5"
                >
                  <span className="text-xs text-foreground/70">{g.name}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      g.type === "yes"
                        ? "bg-green-400/10 text-green-400"
                        : g.type === "no"
                        ? "bg-red-400/10 text-red-400"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {g.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="text-right">
            <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">لوحة متابعتك الخاصة</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              كل شيء أمام عينيك{" "}
              <span className="text-primary">بوضوح تام</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              لوحة خاصة بك كصاحب المناسبة — تابع ردود ضيوفك في أي وقت من هاتفك.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {[
                { icon: BarChart3, t: "إحصاءات فورية", d: "أعداد القبول والاعتذار والمنتظرين — تتحدث تلقائياً" },
                { icon: Users, t: "قائمة ضيوف مفصّلة", d: "شوف حالة كل ضيف باسمه — من وصلته الدعوة ومن ردّ" },
                { icon: QrCode, t: "حضور يوم المناسبة", d: "بعد الحفل تعرف من حضر فعلاً بالأرقام الدقيقة" },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/40 p-3">
                  <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg gold-gradient">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DESIGN PICKER ═══ */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-10 text-center">
          <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">اختيارك — ذوقك</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            أنت تختار{" "}
            <span className="text-primary">شكل بطاقتك</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            تصفّح القوالب الفاخرة واختر ما يناسب مناسبتك — نحن نُكمل الباقي.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {designs.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDesign(d.id)}
              className={`group relative overflow-hidden rounded-2xl border-2 p-1 transition ${
                activeDesign === d.id ? "border-primary shadow-lg shadow-primary/20" : "border-border/50 hover:border-primary/40"
              }`}
            >
              <div className={`flex h-28 w-36 flex-col items-center justify-center gap-1 rounded-xl bg-gradient-to-br ${d.bg} ${d.border} border`}>
                <p className={`font-display text-sm font-bold ${d.accent}`}>سارة &amp; خالد</p>
              </div>
              <div className="mt-2 pb-1 text-center">
                <p className="text-xs font-bold">{d.label}</p>
                <p className="text-[10px] text-muted-foreground">{d.sub}</p>
              </div>
              {activeDesign === d.id && (
                <div className="absolute left-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-primary">
                  <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
        {/* preview of selected */}
        <div className="mx-auto mt-8 max-w-xs">
          <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${selected.bg} ${selected.border} p-6 text-center`}>
            <p className={`font-display text-[10px] tracking-[0.3em] opacity-60 ${selected.accent}`}>INVITATION</p>
            <h3 className={`mt-3 font-display text-2xl font-bold ${selected.accent}`}>سارة &amp; خالد</h3>
            <p className={`mt-1 text-[11px] opacity-50 ${selected.accent}`}>الجمعة · ١٢ ربيع الآخر · ٠٨:٣٠ م</p>
            <div className={`my-3 h-px opacity-20 ${selected.accent} bg-current`} />
            <p className={`text-[10px] opacity-40 ${selected.accent}`}>📍 قاعة الماسة — الرياض</p>
            <div className={`mt-3 inline-block rounded-full border px-3 py-0.5 text-[9px] font-bold tracking-widest opacity-60 ${selected.border} ${selected.accent}`}>
              {selected.label}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-12 text-center">
          <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">كيف يعمل؟</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            أربع خطوات منك —{" "}
            <span className="text-primary">الباقي علينا</span>
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-md">
              {i < steps.length - 1 && (
                <div className="absolute left-0 top-9 hidden h-px w-full translate-x-1/2 bg-gradient-to-l from-primary/30 to-transparent md:block" />
              )}
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-full border border-primary/30 font-display text-lg font-bold text-primary">
                {s.n}
              </div>
              <h3 className="font-display text-sm font-bold">{s.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ WHATSAPP ═══ */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/40 backdrop-blur-md">
          <div className="grid items-center md:grid-cols-2">
            {/* Phone mock */}
            <div className="flex justify-center p-8">
              <div className="w-64 overflow-hidden rounded-[2rem] border border-white/10 bg-[#1a1a1a] shadow-2xl">
                <div className="flex items-center gap-2 bg-[#075E54] px-3 py-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    د
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">invitly</p>
                    <p className="text-[9px] text-white/60">متصل الآن</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 p-3">
                  <div className="max-w-[90%] rounded-t-2xl rounded-bl-2xl bg-[#1e3a34] p-2.5 text-[11px] leading-5 text-white/90">
                    السلام عليكم يا أحمد 🌸
                    <br />
                    يتشرف أصحاب الأفراح بدعوتكم
                    <div className="mt-1.5 rounded border border-primary/20 bg-black/30 px-2 py-1 text-center font-display text-[10px] italic text-primary">
                      سارة &amp; خالد · قاعة الماسة
                    </div>
                    <p className="mt-1 text-[9px] text-white/30">٠٨:٣٠ م</p>
                  </div>
                  <div className="self-end max-w-[72%] rounded-t-2xl rounded-br-2xl bg-[#056162] p-2 text-[11px] text-white/80">
                    شكراً، سنكون هناك ✨
                  </div>
                  <div className="max-w-[90%] rounded-t-2xl rounded-bl-2xl bg-[#1e3a34] p-2.5 text-[11px] leading-5 text-white/90">
                    رائع! تم تسجيل حضوركم ✅
                    <br />
                    <span className="text-[9px] text-white/40">سيصلكم تذكير قبل يوم من الحفل</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-8 text-right">
              <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">ربط واتساب بيزنس</p>
              <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
                دعواتك تصل لكل ضيف{" "}
                <span className="text-primary">باسمه الشخصي</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                نرسل الدعوات لجميع ضيوفك عبر واتساب — كل رسالة مخصصة باسم الضيف. ردوده تُسجّل آلياً في لوحتك.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                {[
                  { icon: MessageCircle, t: "إرسال جماعي فوري", d: "لمئات الضيوف في ثوانٍ" },
                  { icon: Users, t: "رسائل بأسماء الضيوف", d: "لمسة شخصية لكل دعوة" },
                  { icon: CheckCircle2, t: "تسجيل الردود آلياً", d: "القبول والاعتذار في لوحتك مباشرة" },
                ].map(({ icon: Icon, t, d }) => (
                  <div key={t} className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/20 px-3 py-2.5">
                    <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-bold">{t}</p>
                      <p className="text-[11px] text-muted-foreground">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ OCCASIONS ═══ */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-8 text-center">
          <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">مناسباتنا</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            لأي مناسبة{" "}
            <span className="text-primary">تحتفل بها</span>
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {[
            { e: "💒", l: "زواج" },
            { e: "💍", l: "خطوبة" },
            { e: "🎂", l: "عيد ميلاد" },
            { e: "🏢", l: "حفل مؤسسي" },
            { e: "🎓", l: "تخرج" },
            { e: "🎊", l: "حفلة خاصة" },
            { e: "👶", l: "عقيقة" },
            { e: "🤝", l: "اجتماع رسمي" },
          ].map((o) => (
            <div
              key={o.l}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-2 text-sm backdrop-blur-md transition hover:border-primary/50 hover:bg-card/70"
            >
              <span>{o.e}</span>
              <span>{o.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-12 text-center">
          <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">الأسعار</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            وضوح تام —{" "}
            <span className="text-primary">بدون رسوم مخفية</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            ادفع مرة واحدة لمناسبتك.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <article
              key={p.name}
              className={`relative rounded-2xl border p-6 transition ${
                p.featured
                  ? "border-primary bg-card/70 shadow-xl shadow-primary/10"
                  : "border-border/60 bg-card/40 hover:border-primary/40"
              } backdrop-blur-md`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-0.5 text-[10px] font-bold tracking-widest text-primary-foreground">
                  الأكثر طلباً
                </div>
              )}
              <p className="text-xs tracking-widest text-muted-foreground">{p.name}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xs text-primary">ر.س</span>
                <span className="font-display text-4xl font-bold">{p.price}</span>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">{p.period}</p>
              <div className="mb-5 h-px bg-border/50" />
              <ul className="mb-6 flex flex-col gap-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-400" />
                    {f}
                  </li>
                ))}
                {p.off.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground/40">
                    <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className={`block w-full rounded-xl py-2.5 text-center text-sm font-bold transition ${
                  p.featured
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border hover:border-primary/50 hover:text-primary"
                }`}
              >
                احجز الآن
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="mx-auto max-w-3xl px-5 pb-24 text-center">
        <div className="lux-divider mx-auto w-24" />
        <p className="mt-8 font-display text-2xl font-bold leading-relaxed sm:text-3xl">
          مناسبتك القادمة تستحق الأفضل —
          <span className="text-primary"> احجز الآن.</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">نتواصل معك خلال ٢٤ ساعة من الحجز</p>
        <Link
          to="/auth"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
        >
          احجز دعوتك الآن ✦
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-8 text-center text-xs tracking-wider text-muted-foreground">
        <div className="mx-auto mb-4 flex max-w-6xl flex-wrap justify-center gap-5 px-5 text-[11px]">
          <a href="#what-you-get" className="hover:text-foreground transition">ماذا ستحصل؟</a>
          <a href="#dashboard" className="hover:text-foreground transition">لوحة المتابعة</a>
          <a href="#pricing" className="hover:text-foreground transition">الأسعار</a>
          <a href="/auth" className="hover:text-foreground transition">تسجيل الدخول</a>
        </div>
        © {new Date().getFullYear()} invitly · جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
