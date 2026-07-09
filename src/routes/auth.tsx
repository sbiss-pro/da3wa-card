import { createFileRoute, redirect } from "@tanstack/react-router";

// Public /auth is disabled. Sign-in happens only via private portal URLs
// (Super Admin / Coordinator / Owner) shared privately by the administration.
export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — INVITLY" },
      { name: "description", content: "تسجيل الدخول لمنصة INVITLY متاح فقط عبر الروابط الخاصة التي تشاركها الإدارة." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "تسجيل الدخول — INVITLY" },
      { property: "og:description", content: "الوصول لمنصة INVITLY يتم عبر بوّابات دخول خاصة." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
