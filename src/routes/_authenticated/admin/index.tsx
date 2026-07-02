import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Palette, Users, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  ssr: false,
  head: () => ({ meta: [{ title: "الإدارة — INVITLY" }] }),
  component: AdminHome,
});

function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">لوحة الإدارة</h1>
        <p className="mt-2 text-muted-foreground">
          إدارة محتوى الموقع وصلاحيات المستخدمين من مكان واحد.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/admin/homepage">
          <Card className="group h-full p-6 transition hover:border-primary hover:shadow-lg">
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl gold-gradient text-primary-foreground">
              <Palette className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-bold">تحرير الصفحة الرئيسية</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              النصوص، الأرقام، الألوان، الأقسام، وكل تفاصيل صفحة INVITLY الرئيسية.
            </p>
          </Card>
        </Link>
        <Link to="/admin/users">
          <Card className="group h-full p-6 transition hover:border-primary hover:shadow-lg">
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl gold-gradient text-primary-foreground">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-bold">إدارة المستخدمين والأدوار</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              منح صلاحيات المدير والمحرر أو سحبها (للمدير الأعلى فقط).
            </p>
          </Card>
        </Link>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold">معاينة الموقع</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              افتح الصفحة الرئيسية لعرض التغييرات المنشورة.
            </p>
          </div>
          <Link
            to="/"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/20"
          >
            <ExternalLink className="h-4 w-4" />
            فتح
          </Link>
        </div>
      </Card>
    </div>
  );
}