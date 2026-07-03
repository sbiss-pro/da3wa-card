import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assignRole,
  listAllUsers,
  revokeRole,
  createUserAccount,
  deleteUserAccount,
  setUserBanned,
} from "@/lib/admin.functions";
import { toast } from "sonner";
import { Trash2, Ban, ShieldCheck, UserPlus } from "lucide-react";

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
  { key: "owner", label: "مالك فعالية" },
] as const;

type Role = (typeof ROLES)[number]["key"];

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

  const toggleRole = async (userId: string, role: Role, has: boolean) => {
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

  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState<Role | "user">("editor");
  const [creating, setCreating] = useState(false);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      await createUserAccount({ data: { email: newEmail.trim(), password: newPass, role: newRole } });
      toast.success("تم إنشاء الحساب");
      setNewEmail("");
      setNewPass("");
      await load();
    } catch (err) {
      toast.error("تعذر إنشاء الحساب", { description: (err as Error).message });
    } finally {
      setCreating(false);
    }
  };

  const removeUser = async (id: string, email: string) => {
    if (!confirm(`حذف الحساب ${email}؟ لا يمكن التراجع.`)) return;
    setBusy(`${id}:del`);
    try {
      await deleteUserAccount({ data: { targetUserId: id } });
      toast.success("تم الحذف");
      await load();
    } catch (e) {
      toast.error("فشل الحذف", { description: (e as Error).message });
    } finally {
      setBusy("");
    }
  };

  const banUser = async (id: string, banned: boolean) => {
    setBusy(`${id}:ban`);
    try {
      await setUserBanned({ data: { targetUserId: id, banned } });
      toast.success(banned ? "تم تعطيل الحساب" : "تم تفعيل الحساب");
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
          إنشاء الحسابات ومنح الصلاحيات وتعطيلها وحذفها. المدير الأعلى فقط يستطيع هذه الإجراءات.
        </p>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-gold" />
          <h2 className="font-display text-lg font-bold">إنشاء حساب جديد</h2>
        </div>
        <form onSubmit={createUser} className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="ne">البريد</Label>
            <Input id="ne" type="email" dir="ltr" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="np">كلمة المرور</Label>
            <Input id="np" type="text" required minLength={8} value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nr">الدور</Label>
            <select
              id="nr"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role | "user")}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="admin">مدير</option>
              <option value="editor">محرر</option>
              <option value="owner">مالك فعالية</option>
              <option value="user">مستخدم عادي</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={creating} className="w-full gold-gradient text-primary-foreground">
              {creating ? "..." : "إنشاء"}
            </Button>
          </div>
        </form>
        <p className="mt-2 text-[11px] text-muted-foreground">
          التسجيل العام مغلق. الحسابات لا تُنشأ إلا من هنا.
        </p>
      </Card>

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
                        onClick={() => toggleRole(u.id, r.key, has)}
                        className={has ? "gold-gradient text-primary-foreground" : ""}
                      >
                        {has ? `إزالة ${r.label}` : `منح ${r.label}`}
                      </Button>
                    );
                  })}
                  <Button size="sm" variant="outline" disabled={busy === `${u.id}:ban`} onClick={() => banUser(u.id, true)}>
                    <Ban className="ms-1 h-3.5 w-3.5" /> تعطيل
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy === `${u.id}:ban`} onClick={() => banUser(u.id, false)}>
                    <ShieldCheck className="ms-1 h-3.5 w-3.5" /> تفعيل
                  </Button>
                  <Button size="sm" variant="destructive" disabled={busy === `${u.id}:del`} onClick={() => removeUser(u.id, u.email)}>
                    <Trash2 className="ms-1 h-3.5 w-3.5" /> حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}