export type WhatsAppConfig = {
  provider: "twilio" | "ultramsg" | "meta";
  api_key: string;
  instance_id: string;
  sender: string;
  message_template?: string;
};
const KEY = "dawati_whatsapp_config";
const TPL_KEY = "dawati_whatsapp_template";
const EVENT_PREFIX = "dawati_wa_event::";

export const DEFAULT_WA_TEMPLATE =
  "السلام عليكم [اللقب] [اسم_الضيف]،\nيسعدنا دعوتكم لحضور مناسبتنا.\nرابط دعوتكم: [رابط_الدعوة]";

export const DEFAULT_WA_CONFIG: WhatsAppConfig = {
  provider: "ultramsg",
  api_key: "",
  instance_id: "",
  sender: "",
  message_template: DEFAULT_WA_TEMPLATE,
};
/**
 * Read WhatsApp config. If eventId is provided, prefer per-event config
 * (falling back to the global one if the event has none yet).
 */
export function getWhatsAppConfig(eventId?: string): WhatsAppConfig {
  try {
    if (eventId) {
      const raw = localStorage.getItem(EVENT_PREFIX + eventId);
      if (raw) {
        const parsed = { ...DEFAULT_WA_CONFIG, ...JSON.parse(raw) };
        if (!parsed.message_template) parsed.message_template = DEFAULT_WA_TEMPLATE;
        return parsed;
      }
    }
    const raw = localStorage.getItem(KEY);
    const base = raw ? { ...DEFAULT_WA_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_WA_CONFIG };
    const tpl = localStorage.getItem(TPL_KEY);
    if (tpl) base.message_template = tpl;
    if (!base.message_template) base.message_template = DEFAULT_WA_TEMPLATE;
    return base;
  } catch { return DEFAULT_WA_CONFIG; }
}
export function saveWhatsAppConfig(c: WhatsAppConfig, eventId?: string) {
  try {
    if (eventId) {
      localStorage.setItem(EVENT_PREFIX + eventId, JSON.stringify(c));
      return;
    }
    const { message_template, ...rest } = c;
    localStorage.setItem(KEY, JSON.stringify(rest));
    if (message_template) localStorage.setItem(TPL_KEY, message_template);
  } catch { /* ignore */ }
}

/** Phone normalizer + validator with Saudi-friendly defaults. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = String(raw).trim().replace(/[\s\-()._]/g, "");
  if (!s) return null;
  // already E.164
  if (s.startsWith("+")) {
    const d = s.slice(1).replace(/\D/g, "");
    if (d.length < 8 || d.length > 15) return null;
    return "+" + d;
  }
  let digits = s.replace(/\D/g, "");
  if (!digits) return null;
  // 00xxx international prefix → drop the 00
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Saudi local (leading 0 e.g. 05XXXXXXXX) → keep Saudi default
  if (/^0\d{8,}$/.test(digits)) return "+966" + digits.slice(1);
  // Excel-stripped leading zero for Saudi mobile: 5XXXXXXXX
  if (/^5\d{8}$/.test(digits)) return "+966" + digits;
  // Anything else: preserve the imported country code as-is, just prepend "+"
  // (e.g. 967xxxx → +967xxxx, 1xxxx → +1xxxx, 9665xxxx → +9665xxxx)
  if (digits.length >= 8 && digits.length <= 15) return "+" + digits;
  return null;
}

/** Split a name that was imported as "Title / Name" back into parts. */
export function splitTitleName(full: string): { title: string; name: string } {
  const m = full.match(/^\s*([^/|·•]+?)\s*[\/|·•]\s*(.+)$/);
  if (m) return { title: m[1].trim(), name: m[2].trim() };
  return { title: "", name: full.trim() };
}

/** Sanitize a freeform template — strip control chars and HTML brackets. */
export function sanitizeTemplate(t: string): string {
  return (t || "").replace(/[<>]/g, "").slice(0, 1000);
}

/** Apply [اللقب] / [اسم_الضيف] / [رابط_الدعوة] placeholders. */
export function applyTemplate(
  template: string,
  vars: { title?: string; name: string; url: string },
): string {
  const t = sanitizeTemplate(template || DEFAULT_WA_TEMPLATE);
  return t
    .replace(/\[اللقب\]/g, vars.title || "")
    .replace(/\[اسم_الضيف\]/g, vars.name || "")
    .replace(/\[رابط_الدعوة\]/g, vars.url || "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Simulated send — returns a promise resolving with per-recipient outcome. */
export async function simulateWhatsAppBlast(
  config: WhatsAppConfig,
  recipients: { name: string; phone: string | null; url: string; title?: string }[],
): Promise<{ sent: number; failed: number; skipped: number }> {
  if (!config.api_key || !config.instance_id) {
    throw new Error("يرجى إعداد بيانات WhatsApp أولاً من التكاملات");
  }
  const tpl = config.message_template || DEFAULT_WA_TEMPLATE;
  let sent = 0, failed = 0, skipped = 0;
  for (const r of recipients) {
    const phone = normalizePhone(r.phone);
    if (!phone) { skipped++; continue; }
    // Build message (would be POSTed server-side in production).
    void applyTemplate(tpl, { title: r.title, name: r.name, url: r.url });
    await new Promise(res => setTimeout(res, 120));
    // simulated 95% success
    if (Math.random() < 0.95) sent++; else failed++;
  }
  return { sent, failed, skipped };
}