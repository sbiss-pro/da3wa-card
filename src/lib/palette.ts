/**
 * Browser-only palette extraction tuned for invitation imagery.
 *
 * Strategy:
 *  - Draw the image onto a 96x96 canvas, sample every pixel.
 *  - Quantize RGB to 16-step buckets (1024 cells / channel) and keep dominant
 *    cells with average rgb + count.
 *  - Skip near-white & near-black noise, but allow soft creams / deep inks.
 *  - Assign semantic roles so the guest page looks intentional:
 *      [0] bg       — darkest dominant tone (deep, low-luminance)
 *      [1] accent   — highest chroma color (gold / burgundy / ink-jewel)
 *      [2] surface  — lighter mid-tone for soft cards
 *      [3] surface2 — second mid-tone for gradients
 *  - If contrast between bg and accent is weak, derive bg by darkening the
 *    dominant tone so text/accent always read crisply.
 */
export async function extractPalette(src: string, count = 4): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 96;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("canvas unavailable")); return; }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 200) continue;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          // Skip pure white/black noise only (keep creams + inks)
          if (max < 12 || min > 248) continue;
          const qr = r >> 4, qg = g >> 4, qb = b >> 4;
          const key = `${qr},${qg},${qb}`;
          const cur = buckets.get(key);
          if (cur) { cur.r += r; cur.g += g; cur.b += b; cur.n += 1; }
          else buckets.set(key, { r, g, b, n: 1 });
        }
        // Average each bucket to its representative color.
        type Cand = { hex: string; r: number; g: number; b: number; n: number; lum: number; sat: number };
        const cands: Cand[] = [];
        for (const c of buckets.values()) {
          const r = Math.round(c.r / c.n), g = Math.round(c.g / c.n), b = Math.round(c.b / c.n);
          const hex = rgbToHex(r, g, b);
          cands.push({ hex, r, g, b, n: c.n, lum: luminance(r, g, b), sat: saturation(r, g, b) });
        }
        if (cands.length === 0) { resolve(fallbackPalette()); return; }
        // De-duplicate visually similar candidates, keeping the heaviest.
        cands.sort((a, b) => b.n - a.n);
        const unique: Cand[] = [];
        for (const c of cands) {
          if (!unique.some((u) => hexDist(u.hex, c.hex) < 28)) unique.push(c);
          if (unique.length >= 12) break;
        }
        // Accent — highest chroma weighted by frequency, prefer non-extreme luminance.
        const accentScore = (c: Cand) =>
          c.sat * Math.sqrt(c.n) * (1 - Math.abs(c.lum - 0.5) * 0.6);
        const accent = [...unique].sort((a, b) => accentScore(b) - accentScore(a))[0];
        // Background — most dominant darker tone; if none dark enough, derive from dominant.
        const darkPool = unique.filter((c) => c.hex !== accent.hex && c.lum < 0.45);
        const bg = darkPool.length > 0
          ? darkPool.sort((a, b) => b.n - a.n)[0]
          : toCand(darkenHex(unique[0].hex, 0.62));
        // Surfaces — pick two mid/light tones distinct from bg+accent for depth.
        const restPool = unique
          .filter((c) => c.hex !== accent.hex && c.hex !== bg.hex)
          .sort((a, b) => b.n - a.n);
        const surface = restPool[0] ?? toCand(lightenHex(bg.hex, 0.18));
        const surface2 = restPool.find((c) => hexDist(c.hex, surface.hex) > 32) ?? toCand(lightenHex(bg.hex, 0.08));
        // Final contrast safety — ensure bg vs accent is readable.
        let bgHex = bg.hex;
        if (Math.abs(luminanceHex(bgHex) - luminanceHex(accent.hex)) < 0.18) {
          bgHex = luminanceHex(accent.hex) > 0.5 ? darkenHex(accent.hex, 0.7) : darkenHex(bgHex, 0.35);
        }
        const out = [bgHex, accent.hex, surface.hex, surface2.hex].slice(0, count);
        while (out.length < count) out.push("#1a1410");
        resolve(out);
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function hexDist(a: string, b: string): number {
  const A = hexToRgb(a), B = hexToRgb(b);
  return Math.sqrt((A.r - B.r) ** 2 + (A.g - B.g) ** 2 + (A.b - B.b) ** 2);
}

/** Pick #fff or #1a1410 based on relative luminance for max contrast. */
export function readableTextOn(bg: string): string {
  const { r, g, b } = hexToRgb(bg);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "#1a1410" : "#ffffff";
}

function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function luminanceHex(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return luminance(r, g, b);
}
function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}
function clamp(n: number, lo = 0, hi = 255): number { return Math.max(lo, Math.min(hi, n)); }
function darkenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(clamp(Math.round(r * (1 - amount))), clamp(Math.round(g * (1 - amount))), clamp(Math.round(b * (1 - amount))));
}
function lightenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(clamp(Math.round(r + (255 - r) * amount)), clamp(Math.round(g + (255 - g) * amount)), clamp(Math.round(b + (255 - b) * amount)));
}
function toCand(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return { hex, r, g, b, n: 1, lum: luminance(r, g, b), sat: saturation(r, g, b) };
}
function fallbackPalette(): string[] {
  return ["#1a1410", "#c9a24a", "#f7f1e6", "#3a2e2a"];
}