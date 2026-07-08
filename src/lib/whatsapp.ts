export type WhatsAppConfig = {
  provider: "twilio" | "ultramsg" | "meta";
  api_key: string;
  instance_id: string;
  sender: string;
  message_template?: string;
  image_url?: string;
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
  image_url: "",
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

/**
 * Phone normalizer + validator.
 * Rule: if the incoming number ALREADY carries an international prefix
 * (starts with "+" or "00"), preserve that country code as-is.
 * Otherwise (local format) automatically default to Saudi Arabia (+966).
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Normalize Eastern Arabic-Indic digits first, then strip separators.
  const eastern = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  let s = String(raw)
    .replace(/[٠-٩]/g, (d) => String(eastern.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(persian.indexOf(d)))
    .trim()
    .replace(/[\s\-()._]/g, "");
  if (!s) return null;

  // Explicit international prefix → preserve as-is.
  if (s.startsWith("+")) {
    const d = s.slice(1).replace(/\D/g, "");
    if (d.length < 8 || d.length > 15) return null;
    return "+" + d;
  }
  if (s.startsWith("00")) {
    const d = s.slice(2).replace(/\D/g, "");
    if (d.length < 8 || d.length > 15) return null;
    return "+" + d;
  }

  // No prefix → treat as Saudi local.
  const digits = s.replace(/\D/g, "");
  if (!digits) return null;
  if (/^0\d{8,9}$/.test(digits)) return "+966" + digits.slice(1);
  if (/^5\d{8}$/.test(digits)) return "+966" + digits;
  if (digits.length >= 8 && digits.length <= 12) return "+966" + digits;
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

/** Progress event for the queued blast. */
export type WaProgress = {
  sent: number;
  failed: number;
  skipped: number;
  processed: number;
  total: number;
  currentName: string;
  etaSeconds: number;
};

export type WaBlastOptions = {
  /** Min delay (ms) between messages — defaults to 5000. */
  minDelayMs?: number;
  /** Max delay (ms) between messages — defaults to 10000. */
  maxDelayMs?: number;
  onProgress?: (p: WaProgress) => void;
  /** Abort signal to stop the queue mid-way. */
  signal?: AbortSignal;
};

/**
 * Queued WhatsApp blast — introduces a randomized human-like delay between
 * messages to avoid rate-limits / number bans, and emits progress events so
 * callers can render a live progress bar + ETA.
 */
export async function simulateWhatsAppBlast(
  config: WhatsAppConfig,
  recipients: { name: string; phone: string | null; url: string; title?: string }[],
  opts: WaBlastOptions = {},
): Promise<{ sent: number; failed: number; skipped: number }> {
  if (!config.api_key || !config.instance_id) {
    throw new Error("يرجى إعداد بيانات WhatsApp أولاً من التكاملات");
  }
  const tpl = config.message_template || DEFAULT_WA_TEMPLATE;
  const minD = Math.max(0, opts.minDelayMs ?? 5000);
  const maxD = Math.max(minD, opts.maxDelayMs ?? 10000);
  let sent = 0, failed = 0, skipped = 0;
  const total = recipients.length;
  for (let i = 0; i < recipients.length; i++) {
    if (opts.signal?.aborted) break;
    const r = recipients[i];
    const phone = normalizePhone(r.phone);
    if (!phone) {
      skipped++;
    } else {
      void applyTemplate(tpl, { title: r.title, name: r.name, url: r.url });
      // simulated 95% success
      if (Math.random() < 0.95) sent++; else failed++;
    }
    const remaining = total - (i + 1);
    const avgDelay = (minD + maxD) / 2;
    opts.onProgress?.({
      sent, failed, skipped,
      processed: i + 1, total,
      currentName: r.name,
      etaSeconds: Math.round((remaining * avgDelay) / 1000),
    });
    if (i < recipients.length - 1) {
      const delay = phone ? Math.floor(minD + Math.random() * (maxD - minD)) : 120;
      await new Promise<void>((resolve) => {
        const t = setTimeout(resolve, delay);
        opts.signal?.addEventListener("abort", () => { clearTimeout(t); resolve(); }, { once: true });
      });
    }
  }
  return { sent, failed, skipped };
}