/**
 * Pure path/negotiation helpers shared by the Markdown proxy and route.
 * Kept free of heavy imports so the proxy bundle stays light.
 */

export const MARKDOWN_MEDIA_TYPE = "text/markdown";

/** Canonicalizes a path: strips `.md` and trailing slash, maps `/index` → `/`. */
export function normalizeMarkdownPath(raw: string): string {
  const trimmed = raw.trim();
  const slashed = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutMd = slashed.endsWith(".md") ? slashed.slice(0, -3) : slashed;
  const withoutTrailing =
    withoutMd.length > 1 && withoutMd.endsWith("/")
      ? withoutMd.slice(0, -1)
      : withoutMd;
  return withoutTrailing === "/index" ? "/" : withoutTrailing;
}

/**
 * Parses an `Accept` header into `{ type, q }` entries (type + `q` matched
 * case-insensitively; entries with `q` outside [0, 1] dropped, e.g. `q=2`).
 */
function parseAccept(accept: string): Array<{ type: string; q: number }> {
  const entries: Array<{ type: string; q: number }> = [];
  for (const part of accept.split(",")) {
    const [media, ...params] = part
      .trim()
      .split(";")
      .map((p) => p.trim());
    if (!media) {
      continue;
    }
    const qParam = params.find((p) => p.toLowerCase().startsWith("q="));
    const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
    if (!Number.isFinite(q) || q < 0 || q > 1) {
      continue;
    }
    entries.push({ type: media.toLowerCase(), q });
  }
  return entries;
}

/**
 * True when `text/markdown` is the preferred type (q > 0 and >= every other
 * type's q). So `text/markdown` wins; `;q=0` and HTML-preferred lists do not.
 */
export function prefersMarkdown(accept: string): boolean {
  const entries = parseAccept(accept);
  const markdownQ = entries
    .filter(({ type }) => type === MARKDOWN_MEDIA_TYPE)
    .reduce((max, { q }) => Math.max(max, q), 0);
  const otherQ = entries
    .filter(({ type }) => type !== MARKDOWN_MEDIA_TYPE)
    .reduce((max, { q }) => Math.max(max, q), 0);
  return markdownQ > 0 && markdownQ >= otherQ;
}
