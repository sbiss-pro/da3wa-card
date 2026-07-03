import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";

const OWNER_KEY = "5m9p4t6q-owner-invitly";

export const Route = createFileRoute("/o-portal/$key")({
  ssr: false,
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: OwnerPortal,
});

function OwnerPortal() {
  const navigate = useNavigate();
  const { key } = useParams({ from: "/o-portal/$key" });
  useEffect(() => {
    if (key === OWNER_KEY) navigate({ to: "/o/login", replace: true });
  }, [key, navigate]);
  if (key === OWNER_KEY) {
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        جاري تحويلك…
      </div>
    );
  }
  return (
    <div dir="rtl" className="grid min-h-screen place-items-center bg-background px-4 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold">٤٠٤</h1>
        <p className="mt-2 text-sm text-muted-foreground">الصفحة المطلوبة غير موجودة.</p>
      </div>
    </div>
  );
}