import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Heart, Briefcase, Cake, Users, QrCode, BarChart3, MailCheck, Sparkles, ArrowLeft, FileSpreadsheet, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "دعوتي — منصة دعوات الفعاليات الرقمية" },
      { name: "description", content: "أنشئ دعوات أنيقة لأعراسك ومناسباتك، أدر المدعوين، وتتبع الردود بكل سهولة." },
      { property: "og:title", content: "دعوتي — دعوات إلكترونية فاخرة" },
      { property: "og:description", content: "تصاميم راقية، إدارة مدعوين، تتبع ردود، وتسجيل حضور عبر QR." },
    ],
  }),
  component: Index,
});

function Index() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem("theme") as "dark" | "light" | null)) || "dark";
    setTheme(stored);
    document.documentElement.classList.toggle("light", stored === "light");
  }, []);
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", next); } catch { /* ignore */ }
      document.documentElement.classList.toggle("light", next === "light");
      return next;
    });
  };
  const eventTypes = [
    { icon: Heart, label: "أعراس" },
    { icon: Sparkles, label: "خطوبة" },
    { icon: Cake, label: "أعياد ميلاد" },
    { icon: Briefcase, label: "فعاليات مؤسسية" },
    { icon: Users, label: "اجتماعات" },
  ];
  // 6 features arranged in an asymmetric bento grid.
  const features = [
    { icon: Sparkles, title: "منشئ بطاقات الدعوة", desc: "قوالب راقية قابلة للتخصيص بالألوان والخطوط والصور.", span: "md:col-span-2 md:row-span-2", tall: true },
    { icon: FileSpreadsheet, title: "استيراد من Excel", desc: "ارفع قائمة المدعوين بثلاثة أعمدة في ثوانٍ.", span: "" },
    { icon: BarChart3, title: "تتبع الردود لحظياً", desc: "إحصاءات بصرية للقبول والاعتذار والحضور.", span: "" },
    { icon: MailCheck, title: "تذكيرات وإشعارات", desc: "إشعار للمدعوين قبل الحفل بإرسال آلي.", span: "" },
    { icon: QrCode, title: "تسجيل الحضور بـ QR", desc: "مسح فوري من الكاميرا — مع وضع أوفلاين.", span: "" },
    { icon: Calendar, title: "إضافة للتقويم", desc: "روابط Google و Apple Calendar للضيوف.", span: "md:col-span-2" },
  ];
  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient emerald + champagne aurora */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <span className="blob blob-a top-[-12%] right-[-10%] h-[60vw] w-[60vw] max-h-[720px] max-w-[720px]"
          style={{ background: "radial-gradient(circle at 30% 30%, oklch(0.55 0.12 165 / 0.55), transparent 70%)" }} />
        <span className="blob blob-b bottom-[-18%] left-[-12%] h-[65vw] w-[65vw] max-h-[760px] max-w-[760px]"
          style={{ background: "radial-gradient(circle at 50% 50%, oklch(0.78 0.13 85 / 0.28), transparent 70%)" }} />
        <span className="blob blob-c top-[28%] left-[18%] h-[48vw] w-[48vw] max-h-[560px] max-w-[560px]"
          style={{ background: "radial-gradient(circle at 50% 50%, oklch(0.88 0.08 88 / 0.18), transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(oklch(0.88 0.08 88 / 0.6) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
      </div>

      {/* Discreet top bar — wordmark + a single understated access link */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient font-display font-extrabold">د</span>
            <span className="font-display text-xl font-bold tracking-wide">دعوتي</span>
          </Link>
          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/50 text-foreground/80 transition hover:border-primary/60 hover:text-primary"
            aria-label="تبديل المظهر"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <Link
            to="/auth"
            className="group inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card/50 px-4 py-1.5 text-[12px] font-medium text-primary/90 transition hover:border-primary/60 hover:text-primary"
            aria-label="الدخول إلى لوحة التحكم"
          >
            <span>الدخول</span>
            <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
          </Link>
          </div>
        </div>
      </header>

      {/* HERO — editorial split with glass invitation mock */}
      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:py-24 md:grid-cols-[1.1fr_1fr]">
          <div className="lux-fade-up text-center md:text-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/60 px-4 py-1.5 text-[11px] font-medium tracking-wide text-primary backdrop-blur-md">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              منصة دعوات رقمية فاخرة
            </span>
            <h1 className="mt-7 font-display text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl md:text-6xl">
              ادعُ ضيوفك
              <br />
              <span className="bg-gradient-to-l from-[oklch(0.92_0.08_88)] via-[oklch(0.82_0.12_85)] to-[oklch(0.7_0.14_82)] bg-clip-text text-transparent">
                بأناقة تليق بمناسبتك
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:mx-0 sm:text-lg">
              صمّم بطاقتك، استورد قائمة المدعوين، تتبّع الردود لحظياً، وسجّل الحضور بمسح رمز —
              تجربة واحدة متكاملة، بهوية بصرية ملكية.
            </p>
            <div className="mt-8 lux-divider mx-auto w-40 md:mx-0" />
            <p className="mt-4 text-xs tracking-[0.18em] text-muted-foreground/80">EMERALD · CHAMPAGNE · 2026</p>
          </div>

          {/* Glass invitation mock */}
          <div className="relative mx-auto w-full max-w-sm lux-fade-up" style={{ animationDelay: "0.15s" }}>
            <div aria-hidden className="absolute -inset-6 rounded-[2rem] lux-ornament blur-xl opacity-70" />
            <div className="glass-card relative rounded-[1.75rem] p-7 text-center">
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
              <p className="mt-5 text-[11px] tracking-wider text-muted-foreground">٠٨:٣٠ م · قاعة الماسة</p>
              <div className="mx-auto mt-4 h-px w-16 bg-primary/60" />
            </div>
          </div>
        </div>

        {/* Event-type ribbon */}
        <div className="mx-auto -mt-2 max-w-6xl px-5 pb-12">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {eventTypes.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-1.5 text-xs backdrop-blur-md transition hover:border-primary/50 hover:bg-card/70"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENTO — 6 features */}
      <section className="relative mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-12 text-center">
          <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">SIGNATURE FEATURES</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            تجربة كاملة من البطاقة <span className="text-primary">إلى لحظة الاستقبال</span>
          </h2>
        </div>
        <div className="grid auto-rows-[minmax(170px,auto)] grid-cols-1 gap-4 md:grid-cols-4">
          {features.map(({ icon: Icon, title, desc, span, tall }) => (
            <article
              key={title}
              className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-md transition hover:border-primary/50 hover:bg-card/70 ${span}`}
            >
              <div aria-hidden className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
              <div className="relative flex h-full flex-col">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl gold-gradient">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className={`font-display font-bold ${tall ? "text-2xl sm:text-3xl" : "text-lg"}`}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                {tall ? (
                  <div className="mt-auto pt-6">
                    <div className="lux-divider mb-4" />
                    <p className="text-[11px] tracking-[0.3em] text-primary/80">CRAFTED FOR PREMIUM EVENTS</p>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CLOSING — quiet signature, no CTAs */}
      <section className="mx-auto max-w-3xl px-5 pb-24 text-center">
        <div className="lux-divider mx-auto w-24" />
        <p className="mt-8 font-display text-2xl font-bold leading-relaxed sm:text-3xl">
          كل دعوة لها حكاية —
          <span className="text-primary"> نرويها لك بأسلوب راقٍ.</span>
        </p>
        <p className="mt-4 text-sm text-muted-foreground">منصّة خاصة للمنظّمين والمنسّقين — الوصول عبر الدعوة فقط.</p>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-xs tracking-wider text-muted-foreground">
        © {new Date().getFullYear()} دعوتي · جميع الحقوق محفوظة
      </footer>
    </div>
  );
}