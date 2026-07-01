import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer dir="rtl" className="border-t border-border/50 bg-background/40 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient font-display font-extrabold text-primary-foreground">i</span>
            <span className="font-display text-xl font-bold tracking-wide">invitly</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            خدمة دعوات رقمية فاخرة — نتولى إرسال الدعوات وإدارة قوائم المدعوين لتتفرغ أنت للاحتفال.
          </p>
          <div className="mt-5 flex gap-3">
            <a
              href="https://wa.me/966500000000"
              target="_blank"
              rel="noreferrer"
              aria-label="واتساب"
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card/50 transition hover:border-primary/60 hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href="mailto:hello@invitly.app"
              aria-label="البريد"
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card/50 transition hover:border-primary/60 hover:text-primary"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <p className="font-display text-xs font-bold tracking-[0.3em] text-primary/80">المنصة</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="transition hover:text-foreground">الرئيسية</Link></li>
            <li><Link to="/contact" className="transition hover:text-foreground">تواصل معنا</Link></li>
            <li><a href="https://wa.me/966500000000" target="_blank" rel="noreferrer noopener" className="transition hover:text-foreground">اطلب الخدمة عبر واتساب</a></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-xs font-bold tracking-[0.3em] text-primary/80">قانوني</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="transition hover:text-foreground">سياسة الخصوصية</Link></li>
            <li><Link to="/terms" className="transition hover:text-foreground">الشروط والأحكام</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 py-5 text-center text-xs text-muted-foreground/80">
        © {year} INVITLY · جميع الحقوق محفوظة
      </div>
    </footer>
  );
}