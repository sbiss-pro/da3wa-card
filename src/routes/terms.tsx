import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal-shell";
import { getSiteContent, type SiteContent } from "@/lib/admin.functions";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "الشروط والأحكام — INVITLY" },
      { name: "description", content: "الشروط والأحكام المنظمة لاستخدام منصة INVITLY لإدارة الدعوات الإلكترونية." },
      { property: "og:title", content: "الشروط والأحكام — INVITLY" },
      { property: "og:description", content: "الشروط والأحكام المنظمة لاستخدام منصة INVITLY لإدارة الدعوات الإلكترونية." },
      { property: "og:url", content: "https://da3wa-card.lovable.app/terms" },
    ],
    links: [{ rel: "canonical", href: "https://da3wa-card.lovable.app/terms" }],
  }),
  loader: () => getSiteContent(),
  component: TermsPage,
});

function TermsPage() {
  const c = Route.useLoaderData() as SiteContent;
  const p = c.pages.terms;
  return (
    <LegalShell eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle}>
      <p className="whitespace-pre-line">{p.body}</p>
    </LegalShell>
  );
}
