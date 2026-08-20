/** Returns the URL only when it uses a safe http(s) scheme, otherwise undefined. */
export function safeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = String(url).trim();
  if (!trimmed) return undefined;
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(candidate);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {
    /* ignore */
  }
  return undefined;
}
