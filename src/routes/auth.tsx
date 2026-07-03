import { createFileRoute, redirect } from "@tanstack/react-router";

// Public /auth is disabled. Sign-in happens only via private portal URLs
// (Super Admin / Coordinator / Owner) shared privately by the administration.
export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "غير متاح" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
