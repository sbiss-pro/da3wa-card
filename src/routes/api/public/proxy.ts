import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_TYPES = /^(image\/|application\/pdf|application\/octet-stream)/i;

/**
 * Guests are unauthenticated, so the proxy can't require a session — but it
 * MUST NOT be a general-purpose open proxy either. We restrict callers to
 * our own origin(s) by validating Origin/Referer, which prevents third-party
 * sites from abusing it for their own bandwidth or SSRF pivoting.
 */
function isAllowedCaller(request: Request): boolean {
  const self = new URL(request.url).host.toLowerCase();
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const check = (raw: string | null): boolean => {
    if (!raw) return false;
    try {
      const host = new URL(raw).host.toLowerCase();
      return (
        host === self ||
        host.endsWith(".lovable.app") ||
        host.endsWith(".lovableproject.com") ||
        host === "invitly.app" ||
        host.endsWith(".invitly.app")
      );
    } catch { return false; }
  };
  return check(origin) || check(referer);
}

function safeUrl(raw: string | null): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!safeHost(u.hostname)) return null;
    return u;
  } catch { return null; }
}

function safeHost(hostname: string): boolean {
  let h = hostname.toLowerCase();
  // Strip brackets from IPv6 literals.
  if (h.startsWith("[") && h.endsWith("]")) h = h.slice(1, -1);
  if (
    h === "localhost" ||
    h === "0.0.0.0" ||
    h === "::" ||
    h === "::1" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h.startsWith("127.") ||
    h.startsWith("10.") ||
    h.startsWith("169.254.") ||
    h.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    // IPv6 unique-local (fc00::/7) and link-local (fe80::/10)
    /^fc[0-9a-f]{2}:/.test(h) ||
    /^fd[0-9a-f]{2}:/.test(h) ||
    /^fe[89ab][0-9a-f]:/.test(h) ||
    // IPv4-mapped IPv6 (::ffff:x.x.x.x) — reject blanket to avoid bypass
    h.startsWith("::ffff:") ||
    // Cloud metadata endpoints
    h === "100.100.100.200" ||
    h === "metadata.google.internal"
  ) return false;
  return true;
}

export const Route = createFileRoute("/api/public/proxy")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        if (!isAllowedCaller(request)) {
          return new Response("forbidden", { status: 403, headers: CORS });
        }
        const url = safeUrl(new URL(request.url).searchParams.get("url"));
        if (!url) {
          return new Response("invalid url", { status: 400, headers: CORS });
        }
        try {
          // Manually follow redirects so every hop is re-validated against safeHost.
          let currentUrl: URL = url;
          let upstream: Response | null = null;
          for (let hop = 0; hop < 5; hop++) {
            const res = await fetch(currentUrl.toString(), {
              redirect: "manual",
              headers: { "User-Agent": "DawatiProxy/1.0", Accept: "image/*,application/pdf,*/*" },
            });
            if (res.status >= 300 && res.status < 400) {
              const loc = res.headers.get("location");
              if (!loc) { upstream = res; break; }
              let nextUrl: URL;
              try { nextUrl = new URL(loc, currentUrl); } catch { return new Response("invalid redirect", { status: 502, headers: CORS }); }
              if (nextUrl.protocol !== "http:" && nextUrl.protocol !== "https:") {
                return new Response("blocked redirect", { status: 502, headers: CORS });
              }
              if (!safeHost(nextUrl.hostname)) {
                return new Response("blocked redirect", { status: 502, headers: CORS });
              }
              currentUrl = nextUrl;
              continue;
            }
            upstream = res;
            break;
          }
          if (!upstream) {
            return new Response("too many redirects", { status: 502, headers: CORS });
          }
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