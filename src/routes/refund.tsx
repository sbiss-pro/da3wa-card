import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal-shell";
import { getSiteContent, type SiteContent } from "@/lib/admin.functions";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "سياسة الاسترجاع — INVITLY" },
      { name: "description", content: "سياسة الاسترجاع والإلغاء في INVITLY متوافقة مع نظام التجارة الإلكترونية السعودي." },
      { property: "og:title", content: "سياسة الاسترجاع — INVITLY" },
      { property: "og:description", content: "شروط وضوابط استرجاع المدفوعات في منصة INVITLY." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://da3wa-card.lovable.app/refund" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://da3wa-card.lovable.app/refund" }],
  }),
  loader: () => getSiteContent(),
  component: RefundPage,
});

function RefundPage() {
  const c = Route.useLoaderData() as SiteContent;
  const p = c.refund;
  return (
    <LegalShell eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle}>
      <p className="whitespace-pre-line">{p.body}</p>
    </LegalShell>
  );
}