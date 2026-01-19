export type FieldResolution = {
  value: string | null;
  source: string | null;
};

export function resolveTitle(
  seoTitle: string | undefined,
  title: string | undefined
): FieldResolution {
  if (seoTitle) {
    return { value: seoTitle, source: "seoTitle" };
  }
  if (title) {
    return { value: title, source: "title" };
  }
  return { value: null, source: null };
}

export function resolveDescription(
  seoDescription: string | undefined
): FieldResolution {
  if (seoDescription) {
    return { value: seoDescription, source: "seoDescription" };
  }
  return { value: null, source: null };
}

export function truncate(text: string, maxLength: number): string {
  if (maxLength <= 0) return "";
  if (text.length <= maxLength) return text;
  if (maxLength <= 3) return text.slice(0, maxLength);
  return `${text.slice(0, maxLength - 3)}...`;
}

export function buildUrl(
  baseUrl: string | undefined,
  slug: string | undefined
): string | null {
  if (!slug) return null;
  const normalizedBase = baseUrl?.replace(/\/+$/, "") || "";
  const normalizedSlug = slug.startsWith("/") ? slug : `/${slug}`;
  return `${normalizedBase}${normalizedSlug}`;
}
