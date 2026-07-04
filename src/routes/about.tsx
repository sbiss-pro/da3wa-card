import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal-shell";
import { getSiteContent, type SiteContent } from "@/lib/admin.functions";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — INVITLY" },
      { name: "description", content: "تعرّف على منصة INVITLY وقصتنا في صناعة الدعوات الفاخرة." },
      { property: "og:title", content: "من نحن — INVITLY" },
      { property: "og:description", content: "تعرّف على منصة INVITLY وقصتنا في صناعة الدعوات الفاخرة." },
      { property: "og:url", content: "https://da3wa-card.lovable.app/about" },
    ],
    links: [{ rel: "canonical", href: "https://da3wa-card.lovable.app/about" }],
  }),
  loader: () => getSiteContent(),
  component: AboutPage,
});

function AboutPage() {
  const c = Route.useLoaderData() as SiteContent;
  const p = c.pages.about;
  return (
    <LegalShell eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle}>
      <p className="whitespace-pre-line">{p.body}</p>
    </LegalShell>
  );
}
