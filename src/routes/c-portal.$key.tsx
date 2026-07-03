import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";

const COORD_KEY = "7h3n2r8w-coord-invitly";

export const Route = createFileRoute("/c-portal/$key")({
  ssr: false,
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: CoordPortal,
});

function CoordPortal() {
  const navigate = useNavigate();
  const { key } = useParams({ from: "/c-portal/$key" });
  useEffect(() => {
    if (key === COORD_KEY) navigate({ to: "/c/login", replace: true });
  }, [key, navigate]);
  if (key === COORD_KEY) {
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