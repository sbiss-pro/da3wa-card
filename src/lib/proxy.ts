/**
 * Wrap a remote URL through the same-origin /api/public/proxy endpoint so
 * the browser bypasses CORS / X-Frame-Options when loading images or PDFs
 * pasted by the host into the invitation card.
 */
export function proxied(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  // Already same-origin or data/blob — leave untouched.
  if (trimmed.startsWith("/") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;
  return `/api/public/proxy?url=${encodeURIComponent(trimmed)}`;
}

export function isPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  return clean.endsWith(".pdf");
}