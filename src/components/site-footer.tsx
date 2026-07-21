import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Twitter, Instagram, Phone } from "lucide-react";
import type { SiteBranding, SiteSocial, SiteCommercial } from "@/lib/admin.functions";

const DEFAULT_BRANDING: SiteBranding = {
  siteName: "invitly",
  whatsappNumber: "966500000000",
  logoUrl: "",
};
const DEFAULT_SOCIAL: SiteSocial = {
  twitter: "https://twitter.com/invitly",
  instagram: "https://instagram.com/invitly",
  email: "hello@invitly.app",
  phone: "+966110000000",
};

export function SiteFooter({
  branding = DEFAULT_BRANDING,
  social = DEFAULT_SOCIAL,
  commercial,
}: {
  branding?: SiteBranding;
  social?: SiteSocial;
  commercial?: SiteCommercial;
} = {}) {
  const year = new Date().getFullYear();
  const wa = branding.whatsappNumber || DEFAULT_BRANDING.whatsappNumber;
  return (
    <footer dir="rtl" className="border-t border-border/50 bg-background/40 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2.5">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.siteName} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient font-display font-extrabold text-primary-foreground">
                {branding.siteName.slice(0, 1)}
              </span>
            )}
            <span className="font-display text-xl font-bold tracking-wide">{branding.siteName}</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            خدمة دعوات رقمية فاخرة — نتولى إرسال الدعوات وإدارة قوائم المدعوين لتتفرغ أنت للاحتفال.
          </p>
          <div className="mt-5 flex gap-3">
            <SocialIcon href={`https://wa.me/${wa}`} label="واتساب"><MessageCircle className="h-4 w-4" /></SocialIcon>
            {social.email && <SocialIcon href={`mailto:${social.email}`} label="البريد"><Mail className="h-4 w-4" /></SocialIcon>}
            {social.twitter && <SocialIcon href={social.twitter} label="تويتر"><Twitter className="h-4 w-4" /></SocialIcon>}
            {social.instagram && <SocialIcon href={social.instagram} label="انستقرام"><Instagram className="h-4 w-4" /></SocialIcon>}
            {social.phone && <SocialIcon href={`tel:${social.phone}`} label="هاتف"><Phone className="h-4 w-4" /></SocialIcon>}
          </div>
        </div>
        <div>
          <p className="font-display text-xs font-bold tracking-[0.3em] text-primary/80">المنصة</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="transition hover:text-foreground">الرئيسية</Link></li>
            <li><Link to="/pricing" className="transition hover:text-foreground">الأسعار</Link></li>
            <li><Link to="/about" className="transition hover:text-foreground">من نحن</Link></li>
            <li><Link to="/contact" className="transition hover:text-foreground">تواصل معنا</Link></li>
            <li><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer noopener" className="transition hover:text-foreground">اطلب الخدمة عبر واتساب</a></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-xs font-bold tracking-[0.3em] text-primary/80">قانوني</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="transition hover:text-foreground">سياسة الخصوصية</Link></li>
            <li><Link to="/terms" className="transition hover:text-foreground">الشروط والأحكام</Link></li>
            <li><Link to="/refund" className="transition hover:text-foreground">سياسة الاسترجاع</Link></li>
            <li><Link to="/status" className="transition hover:text-foreground">حالة النظام</Link></li>
          </ul>
        </div>
        {commercial && (
          <div>
            <p className="font-display text-xs font-bold tracking-[0.3em] text-primary/80">المنشأة</p>
            <ul className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
              {commercial.entityName && <li className="text-foreground/90">{commercial.entityName}</li>}
              {commercial.crNumber && <li>سجل تجاري: {commercial.crNumber}</li>}
              {commercial.vatNumber && <li>رقم ضريبي: {commercial.vatNumber}</li>}
              {commercial.address && <li>{commercial.address}</li>}
              {commercial.workHours && <li>{commercial.workHours}</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-border/40 py-5 text-center text-xs text-muted-foreground/80">
        © {year} {branding.siteName} · جميع الحقوق محفوظة
      </div>
    </footer>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card/50 transition hover:border-primary/60 hover:text-primary"
    >
      {children}
    </a>
  );
}