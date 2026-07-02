import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { assignRole, listAllUsers, revokeRole } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  ssr: false,
  head: () => ({ meta: [{ title: "المستخدمون — INVITLY" }] }),
  component: UsersAdmin,
});

type Row = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
};

const ROLES = [
  { key: "admin", label: "مدير" },
  { key: "editor", label: "محرر" },
] as const;

function UsersAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>("");

  const load = async () => {
    setLoading(true);
    try {
      const data = (await listAllUsers()) as Row[];
      setRows(data);
    } catch (e) {
      toast.error("تعذر تحميل المستخدمين", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRole = async (userId: string, role: "admin" | "editor", has: boolean) => {
    setBusy(`${userId}:${role}`);
    try {
      if (has) {
        await revokeRole({ data: { targetUserId: userId, role } });
        toast.success("تم سحب الصلاحية");
      } else {
        await assignRole({ data: { targetUserId: userId, role } });
        toast.success("تم منح الصلاحية");
      }
      await load();
    } catch (e) {
      toast.error("فشل التنفيذ", { description: (e as Error).message });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">إدارة المستخدمين</h1>
        <p className="mt-2 text-muted-foreground">
          امنح أو اسحب صلاحيات المدير/المحرر. المدير الأعلى فقط يستطيع هذا الإجراء.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <p className="p-6 text-muted-foreground">جاري التحميل...</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-muted-foreground">لا يوجد مستخدمون بعد.</p>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{u.email || "بلا بريد"}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    آخر دخول: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("ar-SA") : "—"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {ROLES.map((r) => {
                    const has = u.roles.includes(r.key);
                    const busyKey = `${u.id}:${r.key}`;
                    return (
                      <Button
                        key={r.key}
                        size="sm"
                        variant={has ? "default" : "outline"}
                        disabled={busy === busyKey}
                        onClick={() => toggleRole(u.id, r.key as "admin" | "editor", has)}
                        className={has ? "gold-gradient text-primary-foreground" : ""}
                      >
                        {has ? `إزالة ${r.label}` : `منح ${r.label}`}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}