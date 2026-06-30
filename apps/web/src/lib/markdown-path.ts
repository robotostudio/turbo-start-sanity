/**
 * Pure path/negotiation helpers shared by the Markdown middleware and route.
 * Kept free of heavy imports so the middleware bundle stays light.
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
  if (path === "/index" || path === "") {
    path = "/";
  }
  return path;
}

/**
 * Parses an `Accept` header into `{ type, q }` entries. Media types and the
 * `q` parameter are matched case-insensitively; entries whose `q` is not a
 * finite number within [0, 1] are dropped as invalid (e.g. `q=2`).
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
 * True when `text/markdown` is the client's preferred representation — its
 * q-value is > 0 and at least as high as every other accepted type. So
 * `Accept: text/markdown` wins; `text/markdown;q=0` and
 * `text/html, text/markdown;q=0.1` (HTML preferred) do not.
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
