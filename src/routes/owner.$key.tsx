import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";

// Secret owner portal — the URL itself is the shared secret.
// Only the exact key below grants access to the admin sign-in page.
const OWNER_KEY = "9x2k7q4mvp-invitly-2026";

export const Route = createFileRoute("/owner/$key")({
  ssr: false,
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: OwnerPortal,
});

function OwnerPortal() {
  const navigate = useNavigate();
  const { key } = useParams({ from: "/owner/$key" });

  useEffect(() => {
    if (key === OWNER_KEY) navigate({ to: "/sa-login", replace: true });
  }, [key, navigate]);

  if (key === OWNER_KEY) {
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        جاري تحويلك إلى بوابة الإدارة…
      </div>
    );
  }

  return (
    <div dir="rtl" className="grid min-h-screen place-items-center bg-background px-4 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">٤٠٤</h1>
        <p className="mt-2 text-sm text-muted-foreground">الصفحة المطلوبة غير موجودة.</p>
      </div>
    </div>
  );
}