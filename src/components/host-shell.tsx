import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, LayoutDashboard, Plus, Menu, X, Sun, Moon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function useTheme(): ["dark" | "light", () => void] {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem("theme") as "dark" | "light" | null)) || "dark";
    setTheme(stored);
    document.documentElement.classList.toggle("light", stored === "light");
  }, []);
  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", next); } catch { /* ignore */ }
      document.documentElement.classList.toggle("light", next === "light");
      return next;
    });
  };
  return [theme, toggle];
}

export function HostShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };
  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full gold-gradient text-primary-foreground font-bold">i</span>
            <span className="truncate font-display text-lg font-bold tracking-wide">INVITLY</span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/dashboard"><Button variant="ghost" size="sm"><LayoutDashboard className="ms-1 h-4 w-4" /> اللوحة</Button></Link>
            <Link to="/events/new"><Button size="sm" className="gold-gradient text-primary-foreground"><Plus className="ms-1 h-4 w-4" /> فعالية جديدة</Button></Link>
            <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="تبديل المظهر">
              {theme === "dark" ? <Sun className="ms-1 h-4 w-4" /> : <Moon className="ms-1 h-4 w-4" />}
              {theme === "dark" ? "فاتح" : "داكن"}
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="ms-1 h-4 w-4" /> خروج</Button>
          </div>
          <div className="flex items-center gap-1 md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="تبديل المظهر">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setOpen(v => !v)} aria-label="القائمة">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {open ? (
          <div className="border-t border-border bg-card md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              <Link to="/dashboard" onClick={() => setOpen(false)}><Button variant="ghost" className="w-full justify-start"><LayoutDashboard className="ms-1 h-4 w-4" /> اللوحة</Button></Link>
              <Link to="/events/new" onClick={() => setOpen(false)}><Button className="w-full justify-start gold-gradient text-primary-foreground"><Plus className="ms-1 h-4 w-4" /> فعالية جديدة</Button></Link>
              <Button variant="ghost" className="w-full justify-start" onClick={() => { setOpen(false); signOut(); }}><LogOut className="ms-1 h-4 w-4" /> خروج</Button>
            </div>
          </div>
        ) : null}
      </header>
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">{children}</main>
    </div>
  );
}