/**
 * Pure path/negotiation helpers shared by the Markdown proxy and route.
 * Kept free of heavy imports so the proxy bundle stays light.
 */

export const MARKDOWN_MEDIA_TYPE = "text/markdown";

/** Canonicalizes a path: strips `.md` and trailing slash, maps `/index` → `/`. */
export function normalizeMarkdownPath(raw: string): string {
  let path = raw.trim();
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  if (path.endsWith(".md")) {
    path = path.slice(0, -3);
  }
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  if (path === "/index") {
    path = "/";
  }
  return path;
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
  let markdownQ = 0;
  let otherQ = 0;
  for (const { type, q } of parseAccept(accept)) {
    if (type === MARKDOWN_MEDIA_TYPE) {
      markdownQ = Math.max(markdownQ, q);
    } else {
      otherQ = Math.max(otherQ, q);
    }
  }
  return markdownQ > 0 && markdownQ >= otherQ;
}
