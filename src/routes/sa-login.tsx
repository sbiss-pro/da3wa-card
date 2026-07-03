import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

const SUPER_ADMIN_EMAIL = "saeedbiss@hotmail.com";

export const Route = createFileRoute("/sa-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Restricted" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SaLogin,
});

function SaLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
        navigate({ to: "/admin" });
      }
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (email.trim().toLowerCase() !== SUPER_ADMIN_EMAIL) {
        throw new Error("غير مصرح");
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      toast.success("مرحباً بك");
      navigate({ to: "/admin" });
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
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">بوابة الإدارة الرئيسية</h1>
            <p className="text-xs text-muted-foreground">مخصصة للمدير الأعلى فقط</p>
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