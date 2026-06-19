import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HostShell } from "@/components/host-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ShieldCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { getWhatsAppConfig, saveWhatsAppConfig, type WhatsAppConfig, DEFAULT_WA_CONFIG } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({ meta: [{ title: "التكاملات — دعوتي" }] }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const [cfg, setCfg] = useState<WhatsAppConfig>(DEFAULT_WA_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCfg(getWhatsAppConfig());
    setLoaded(true);
  }, []);

  const save = () => {
    saveWhatsAppConfig(cfg);
    toast.success("تم حفظ إعدادات WhatsApp");
  };

  const isConfigured = Boolean(cfg.api_key && cfg.instance_id);

  return (
    <HostShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">التكاملات</h1>
        <p className="text-muted-foreground">إدارة التكاملات الخارجية لإرسال الدعوات والتذكيرات</p>
      </div>

      <Card className="max-w-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">WhatsApp</h2>
              <p className="text-sm text-muted-foreground">إرسال روابط الدعوات للمدعوين عبر WhatsApp</p>
            </div>
          </div>
          {loaded ? (
            <Badge variant={isConfigured ? "default" : "outline"} className={isConfigured ? "bg-emerald-500 text-white" : ""}>
              <ShieldCheck className="ms-1 h-3 w-3" /> {isConfigured ? "مفعّل" : "غير مفعّل"}
            </Badge>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>المزود</Label>
            <Select value={cfg.provider} onValueChange={(v) => setCfg({ ...cfg, provider: v as WhatsAppConfig["provider"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ultramsg">UltraMsg</SelectItem>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="meta">Meta Cloud API</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>مفتاح API</Label>
            <Input
              type="password"
              value={cfg.api_key}
              onChange={(e) => setCfg({ ...cfg, api_key: e.target.value })}
              placeholder="sk_live_xxx"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label>معرّف الاتصال (Instance ID / Account SID)</Label>
            <Input
              value={cfg.instance_id}
              onChange={(e) => setCfg({ ...cfg, instance_id: e.target.value })}
              placeholder="instance123"
            />
          </div>
          <div className="space-y-2">
            <Label>رقم المُرسِل (اختياري)</Label>
            <Input
              value={cfg.sender}
              onChange={(e) => setCfg({ ...cfg, sender: e.target.value })}
              placeholder="+9665XXXXXXXX"
              dir="ltr"
            />
          </div>
          <Button onClick={save} className="w-full gold-gradient text-primary-foreground">
            <Save className="ms-2 h-4 w-4" /> حفظ الإعدادات
          </Button>
          <p className="text-xs text-muted-foreground">
            ملاحظة: هذا إعداد تجريبي يُحفظ محلياً على هذا الجهاز. عند الإرسال الفعلي سيتم استخدام هذه البيانات للاتصال بمزوّد الخدمة.
          </p>
        </div>
      </Card>
    </HostShell>
  );
}