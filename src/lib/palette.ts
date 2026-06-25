/**
 * Browser-only palette extraction. Draws the image onto a 64x64 canvas and
 * builds a histogram over RGB values quantized to 32-step buckets, then
 * returns the top N colors as hex strings.
 */
export async function extractPalette(src: string, count = 4): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 64;
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
          // Skip near-white & near-black noise
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          if (max < 18 || min > 240) continue;
          const qr = r >> 5, qg = g >> 5, qb = b >> 5;
          const key = `${qr},${qg},${qb}`;
          const cur = buckets.get(key);
          if (cur) { cur.r += r; cur.g += g; cur.b += b; cur.n += 1; }
          else buckets.set(key, { r, g, b, n: 1 });
        }
        const sorted = Array.from(buckets.values()).sort((a, b) => b.n - a.n);
        const picked: string[] = [];
        for (const c of sorted) {
          const hex = rgbToHex(Math.round(c.r / c.n), Math.round(c.g / c.n), Math.round(c.b / c.n));
          if (!picked.some((p) => hexDist(p, hex) < 36)) picked.push(hex);
          if (picked.length >= count) break;
        }
        while (picked.length < count) picked.push("#1a1410");
        resolve(picked);
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