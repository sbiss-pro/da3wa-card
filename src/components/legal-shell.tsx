import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function LegalShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <span
          className="absolute -top-32 -right-32 h-[60vw] max-h-[600px] w-[60vw] max-w-[600px] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.12 165 / 0.5), transparent 70%)" }}
        />
      </div>
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient font-display font-extrabold text-primary-foreground">i</span>
            <span className="font-display text-xl font-bold tracking-wide">invitly</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            الرئيسية
            <ChevronLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="font-display text-[11px] tracking-[0.4em] text-primary/80">{eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p> : null}
        <div className="mt-8 lux-divider w-32" />
        <article className="prose prose-invert mt-8 max-w-none text-sm leading-loose text-muted-foreground [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ps-6 [&_ul]:mb-4 [&_li]:mb-1.5 [&_strong]:text-foreground">
          {children}
        </article>
        <p className="mt-12 text-xs text-muted-foreground/70">آخر تحديث: ٣٠ يونيو ٢٠٢٦</p>
      </main>
    </div>
  );
}