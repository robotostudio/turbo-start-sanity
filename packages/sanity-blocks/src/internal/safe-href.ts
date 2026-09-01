const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

export function isSafeHref(href: string): boolean {
  if (href.startsWith("/") || href.startsWith("#")) {
    return true;
  }
  try {
    return ALLOWED_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}

export function sanitizeHref(
  href?: string | null | undefined
): string | undefined {
  const trimmed = href?.trim();
  if (!trimmed) {
    return undefined;
  }
  return isSafeHref(trimmed) ? trimmed : undefined;
}

/**
 * Narrow a caller-supplied value to a same-origin path, or `/`. Stricter than
 * `isSafeHref`, which allows external URLs on purpose. `//evil.com` and
 * `/\evil.com` are protocol-relative, so a leading `/` alone is not enough.
 */
export function internalPathOnly(path?: string | null): string {
  if (!path?.startsWith("/") || /^\/[/\\]/.test(path)) {
    return "/";
  }
  return path;
}
