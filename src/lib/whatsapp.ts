export type WhatsAppConfig = {
  provider: "twilio" | "ultramsg" | "meta";
  api_key: string;
  instance_id: string;
  sender: string;
};
const KEY = "dawati_whatsapp_config";
export const DEFAULT_WA_CONFIG: WhatsAppConfig = {
  provider: "ultramsg",
  api_key: "",
  instance_id: "",
  sender: "",
};
export function getWhatsAppConfig(): WhatsAppConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_WA_CONFIG;
    return { ...DEFAULT_WA_CONFIG, ...JSON.parse(raw) };
  } catch { return DEFAULT_WA_CONFIG; }
}
export function saveWhatsAppConfig(c: WhatsAppConfig) {
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

/** Naive phone normalizer + validator. Returns null if invalid. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[^\d+]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return cleaned.startsWith("+") ? cleaned : `+${digits}`;
}

/** Simulated send — returns a promise resolving with per-recipient outcome. */
export async function simulateWhatsAppBlast(
  config: WhatsAppConfig,
  recipients: { name: string; phone: string | null; url: string }[],
): Promise<{ sent: number; failed: number; skipped: number }> {
  if (!config.api_key || !config.instance_id) {
    throw new Error("يرجى إعداد بيانات WhatsApp أولاً من التكاملات");
  }
  let sent = 0, failed = 0, skipped = 0;
  for (const r of recipients) {
    const phone = normalizePhone(r.phone);
    if (!phone) { skipped++; continue; }
    await new Promise(res => setTimeout(res, 120));
    // simulated 95% success
    if (Math.random() < 0.95) sent++; else failed++;
  }
  return { sent, failed, skipped };
}