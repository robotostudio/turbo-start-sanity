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
 * Narrow a caller-supplied redirect target to a same-origin path, or `/`.
 * Stricter than `isSafeHref`, which allows external URLs on purpose.
 *
 * Resolves against `base` and compares origins rather than pattern-matching the
 * string, because the set of inputs that escape is larger than it looks: the URL
 * parser strips tab, LF and CR, so `/%09/evil.com` arrives as `/<TAB>/evil.com`
 * and leaves the browser as `//evil.com`. Delegating to the same parser the
 * browser uses covers those without enumerating them.
 */
export function internalPathOnly(
  path: string | null | undefined,
  base: string | URL
): string {
  if (!path) {
    return "/";
  }
  try {
    const baseUrl = new URL(base);
    const target = new URL(path, baseUrl);
    return target.origin === baseUrl.origin
      ? `${target.pathname}${target.search}${target.hash}`
      : "/";
  } catch {
    return "/";
  }
}
