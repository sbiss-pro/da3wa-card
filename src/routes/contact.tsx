import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — INVITLY" },
      { name: "description", content: "تواصل مع فريق INVITLY لأي استفسار أو طلب دعم — نرد خلال ساعات العمل." },
      { property: "og:title", content: "تواصل معنا — INVITLY" },
      { property: "og:description", content: "تواصل مع فريق INVITLY لأي استفسار أو طلب دعم — نرد خلال ساعات العمل." },
      { property: "og:url", content: "https://da3wa-card.lovable.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://da3wa-card.lovable.app/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const channels = [
    { icon: MessageCircle, label: "واتساب الأعمال", value: "+966 50 000 0000", href: "https://wa.me/966500000000" },
    { icon: Mail, label: "البريد الإلكتروني", value: "hello@invitly.app", href: "mailto:hello@invitly.app" },
    { icon: Phone, label: "الدعم الهاتفي", value: "+966 11 000 0000", href: "tel:+966110000000" },
  ];
  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <span
          className="absolute -top-32 -right-32 h-[60vw] max-h-[600px] w-[60vw] max-w-[600px] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.12 165 / 0.5), transparent 70%)" }}
        />
      </div>
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient font-display font-extrabold text-primary-foreground">i</span>
            <span className="font-display text-xl font-bold tracking-wide">invitly</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">
            الرئيسية
            <ChevronLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-14">
        <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">CONTACT US</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">تواصل معنا</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          نحن هنا لمساعدتك في كل خطوة — اختر القناة الأنسب لك وسنرد خلال ساعات العمل (الأحد – الخميس، ٩ صباحاً – ٦ مساءً).
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className="group rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-md transition hover:border-primary/50 hover:bg-card/70"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl gold-gradient">
                <c.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <p className="font-display text-sm font-bold">{c.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.value}</p>
            </a>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-primary/30 bg-card/40 p-8 backdrop-blur-md">
          <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">FAQ</p>
          <h2 className="mt-2 font-display text-2xl font-bold">أسئلة يسألها الكثيرون</h2>
          <div className="mt-6 space-y-5 text-sm leading-relaxed">
            <div>
              <p className="font-bold text-foreground">كم يستغرق إعداد دعوتي؟</p>
              <p className="mt-1 text-muted-foreground">عادةً أقل من ٢٤ ساعة من تأكيد الدفع وإرسال تفاصيل المناسبة.</p>
            </div>
            <div>
              <p className="font-bold text-foreground">هل يمكنني تعديل قائمة الضيوف بعد الإرسال؟</p>
              <p className="mt-1 text-muted-foreground">نعم، يمكنك إضافة أو حذف ضيوف من لوحة التحكم في أي وقت.</p>
            </div>
            <div>
              <p className="font-bold text-foreground">هل تدعمون الدفع بالتقسيط؟</p>
              <p className="mt-1 text-muted-foreground">قريباً سنوفر الدفع بالتقسيط عبر تابي وتمارا — ترقّب التحديث.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}