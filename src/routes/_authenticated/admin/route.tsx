import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { getMyPermissions } from "@/lib/admin.functions";
import { LayoutDashboard, Users, Palette } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة الإدارة — INVITLY" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    try {
      const perms = await getMyPermissions();
      if (!perms.isSuperAdmin && !perms.isAdmin && !perms.isEditor) {
        throw redirect({ to: "/dashboard" });
      }
      return { perms };
    } catch (e) {
      if ((e as { isRedirect?: boolean })?.isRedirect) throw e;
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { perms } = Route.useRouteContext() as {
    perms: { isSuperAdmin: boolean; isAdmin: boolean; isEditor: boolean };
  };
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full gold-gradient font-display font-extrabold">
              A
            </span>
            <div>
              <p className="font-display text-lg font-bold">لوحة الإدارة</p>
              <p className="text-[11px] text-muted-foreground">
                {perms.isSuperAdmin ? "مدير أعلى" : perms.isAdmin ? "مدير" : "محرر"}
              </p>
            </div>
          </div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            → لوحة المنظم
          </Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 pb-3 text-sm">
          <TabLink to="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>
            نظرة عامة
          </TabLink>
          <TabLink to="/admin/homepage" icon={<Palette className="h-4 w-4" />}>
            الصفحة الرئيسية
          </TabLink>
          {perms.isSuperAdmin && (
            <TabLink to="/admin/users" icon={<Users className="h-4 w-4" />}>
              المستخدمون
            </TabLink>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function TabLink({
  to,
  icon,
  children,
}: {
  to: "/admin" | "/admin/homepage" | "/admin/users";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-1.5 text-muted-foreground transition hover:border-border hover:text-foreground data-[status=active]:border-primary/40 data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
    >
      {icon}
      {children}
    </Link>
  );
}