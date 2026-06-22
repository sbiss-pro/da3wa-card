import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginCoordinator } from "@/lib/coordinator.functions";
import { saveCoordSession, getCoordSession } from "@/lib/coordinator-session";
import { toast } from "sonner";
import { ScanLine, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/c/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "دخول المنسق — دعوتي" }] }),
  component: CoordinatorLogin,
});

function CoordinatorLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getCoordSession();
    if (s) navigate({ to: "/c/event" });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const r = await loginCoordinator({ data: { username, password } });
      saveCoordSession(r);
      toast.success(`مرحباً ${r.name}`);
      navigate({ to: "/c/event" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>
            <ArrowRight className="ms-1 h-4 w-4" /> رجوع للخلف
          </Button>
        </div>
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-full gold-gradient font-bold text-primary-foreground">د</span>
          <span className="font-display text-2xl font-bold">دعوتي</span>
        </Link>
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl gold-gradient text-primary-foreground">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">دخول منسق الفعالية</h1>
              <p className="text-xs text-muted-foreground">للوصول لقائمة المدعوين ومسح QR فقط</p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u">اسم المستخدم</Label>
              <Input id="u" required value={username} onChange={e => setUsername(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p">كلمة المرور</Label>
              <Input id="p" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full gold-gradient text-primary-foreground">
              {loading ? "..." : "دخول"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            هل أنت منظّم الفعالية؟ <Link to="/auth" className="text-gold underline">سجّل دخولاً كمضيف</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}