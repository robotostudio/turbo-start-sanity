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
