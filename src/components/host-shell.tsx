import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, LayoutDashboard, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function HostShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };
  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full gold-gradient text-primary-foreground font-bold">د</span>
            <span className="font-display text-lg font-bold">دعوتي</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/dashboard"><Button variant="ghost" size="sm"><LayoutDashboard className="ms-1 h-4 w-4" /> اللوحة</Button></Link>
            <Link to="/events/new"><Button size="sm" className="gold-gradient text-primary-foreground"><Plus className="ms-1 h-4 w-4" /> فعالية جديدة</Button></Link>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="ms-1 h-4 w-4" /> خروج</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}