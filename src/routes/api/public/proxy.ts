import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_TYPES = /^(image\/|application\/pdf|application\/octet-stream)/i;

function safeUrl(raw: string | null): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    // Block private/loopback hosts to avoid SSRF.
    const h = u.hostname.toLowerCase();
    if (
      h === "localhost" ||
      h.endsWith(".local") ||
      h.startsWith("127.") ||
      h.startsWith("10.") ||
      h.startsWith("169.254.") ||
      h.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(h)
    ) return null;
    return u;
  } catch { return null; }
}

export const Route = createFileRoute("/api/public/proxy")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = safeUrl(new URL(request.url).searchParams.get("url"));
        if (!url) {
          return new Response("invalid url", { status: 400, headers: CORS });
        }
        try {
          const upstream = await fetch(url.toString(), {
            redirect: "follow",
            headers: { "User-Agent": "DawatiProxy/1.0", Accept: "image/*,application/pdf,*/*" },
          });
          if (!upstream.ok || !upstream.body) {
            return new Response("upstream error", { status: 502, headers: CORS });
          }
          const ct = upstream.headers.get("content-type") ?? "application/octet-stream";
          if (!ALLOWED_TYPES.test(ct)) {
            return new Response("unsupported content-type", { status: 415, headers: CORS });
          }
          const len = Number(upstream.headers.get("content-length") ?? 0);
          if (len && len > MAX_BYTES) {
            return new Response("file too large", { status: 413, headers: CORS });
          }
          const headers = new Headers({
            ...CORS,
            "Content-Type": ct,
            "Cache-Control": "public, max-age=86400, immutable",
            "Cross-Origin-Resource-Policy": "cross-origin",
          });
          // Strip framing restrictions so PDFs can render in <iframe>.
          return new Response(upstream.body, { status: 200, headers });
        } catch {
          return new Response("fetch failed", { status: 502, headers: CORS });
        }
      },
    },
  },
});