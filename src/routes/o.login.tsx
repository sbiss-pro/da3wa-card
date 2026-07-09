import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getMyPermissions } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Eye } from "lucide-react";

function safeNext(next: string | undefined): string | null {
  if (!next) return null;
  // Only allow same-origin relative paths.
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export const Route = createFileRoute("/o/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "بوابة المالك" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OwnerLogin,
});

function OwnerLogin() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const nextPath = safeNext(next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      if (nextPath) {
        window.location.replace(nextPath);
        return;
      }
      try {
        const perms = (await getMyPermissions()) as { isSuperAdmin: boolean };
        if (perms.isSuperAdmin) navigate({ to: "/admin" });
        else navigate({ to: "/owner-portal" });
      } catch {
        /* stay */
      }
    })();
  }, [navigate, nextPath]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (nextPath) {
        window.location.replace(nextPath);
      } else {
        navigate({ to: "/owner-portal" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl gold-gradient text-primary-foreground">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">بوابة مالك الفعالية</h1>
            <p className="text-xs text-muted-foreground">للاطلاع على إحصائيات فعالياتك فقط</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="e">البريد</Label>
            <Input id="e" type="email" required dir="ltr" value={email} onChange={(x) => setEmail(x.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p">كلمة المرور</Label>
            <Input id="p" type="password" required value={password} onChange={(x) => setPassword(x.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full gold-gradient text-primary-foreground">
            {loading ? "..." : "دخول"}
          </Button>
        </form>
      </Card>
    </div>
  );
}