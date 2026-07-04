import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal-shell";
import { getSiteContent, type SiteContent } from "@/lib/admin.functions";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — INVITLY" },
      { name: "description", content: "كيف تتعامل منصة INVITLY مع بياناتك وبيانات ضيوفك بسرية واحترام." },
      { property: "og:title", content: "سياسة الخصوصية — INVITLY" },
      { property: "og:description", content: "كيف تتعامل منصة INVITLY مع بياناتك وبيانات ضيوفك بسرية واحترام." },
      { property: "og:url", content: "https://da3wa-card.lovable.app/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://da3wa-card.lovable.app/privacy" }],
  }),
  loader: () => getSiteContent(),
  component: PrivacyPage,
});

function PrivacyPage() {
  const c = Route.useLoaderData() as SiteContent;
  const p = c.pages.privacy;
  return (
    <LegalShell eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle}>
      <p className="whitespace-pre-line">{p.body}</p>
    </LegalShell>
  );
}