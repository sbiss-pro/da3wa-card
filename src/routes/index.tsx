import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Calendar, Heart, Briefcase, Cake, Users, QrCode, BarChart3, MailCheck, Sparkles } from "lucide-react";

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
  const eventTypes = [
    { icon: Heart, label: "أعراس" },
    { icon: Sparkles, label: "خطوبة" },
    { icon: Cake, label: "أعياد ميلاد" },
    { icon: Briefcase, label: "فعاليات مؤسسية" },
    { icon: Users, label: "اجتماعات" },
  ];
  const features = [
    { icon: Sparkles, title: "منشئ بطاقات دعوة", desc: "قوالب راقية قابلة للتخصيص بالألوان والخطوط والصور." },
    { icon: Users, title: "إدارة المدعوين", desc: "استيراد من Excel/CSV، بحث، وتعديل المدعوين بسهولة." },
    { icon: BarChart3, title: "تتبع الردود لحظياً", desc: "إحصاءات بصرية لحالات: قبول، اعتذار، حضور." },
    { icon: MailCheck, title: "تذكيرات آلية", desc: "تذكير من لم يرد، وإرسال QR للحاضرين قبل الموعد." },
    { icon: QrCode, title: "تسجيل حضور بـ QR", desc: "مسح رمز كل مدعو من الكاميرا وتسجيله فوراً." },
    { icon: Calendar, title: "إضافة للتقويم", desc: "روابط Google و Apple Calendar للمدعوين." },
  ];
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient font-bold text-primary-foreground">د</span>
            <span className="font-display text-xl font-bold">دعوتي</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost">تسجيل الدخول</Button></Link>
            <Link to="/auth"><Button className="gold-gradient text-primary-foreground hover:opacity-90">ابدأ مجاناً</Button></Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, oklch(0.82 0.08 80 / 0.6), transparent 50%), radial-gradient(circle at 80% 60%, oklch(0.72 0.13 78 / 0.4), transparent 50%)"
        }} />
        <div className="mx-auto max-w-5xl px-4 py-24 text-center">
          <span className="inline-block rounded-full border border-primary/40 bg-card px-4 py-1 text-xs font-medium text-gold">منصة دعوات إلكترونية فاخرة</span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-tight md:text-7xl">
            ادعُ ضيوفك بأناقة <span className="text-gold">تليق بمناسبتك</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            صمم بطاقتك، استورد قائمة المدعوين من Excel، تتبع الردود لحظياً، وسجّل الحضور بمسح QR — كل ذلك في مكان واحد.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth"><Button size="lg" className="gold-gradient text-primary-foreground hover:opacity-90">أنشئ فعاليتك الآن</Button></Link>
            <Link to="/auth"><Button size="lg" variant="outline">عندي حساب</Button></Link>
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            {eventTypes.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
                <Icon className="h-4 w-4 text-gold" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-4xl font-bold">كل ما تحتاجه لتنظيم مناسبتك</h2>
          <p className="mt-3 text-muted-foreground">من بطاقة الدعوة إلى لحظة استقبال الضيف عند الباب.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/60 hover:shadow-lg">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl gold-gradient text-primary-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="font-display text-4xl font-bold">ابدأ بدعوتك الأولى مجاناً</h2>
          <p className="mt-3 text-muted-foreground">أنشئ حسابك خلال دقيقة وابدأ بإرسال الدعوات لمدعويك.</p>
          <Link to="/auth"><Button size="lg" className="mt-8 gold-gradient text-primary-foreground hover:opacity-90">إنشاء حساب جديد</Button></Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} دعوتي. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}