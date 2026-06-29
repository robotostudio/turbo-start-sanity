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
 * True when an `Accept` header explicitly requests `text/markdown` with a
 * non-zero q-value. `text/markdown;q=0` (an explicit refusal) returns false.
 */
export function acceptsMarkdown(accept: string): boolean {
  return accept
    .split(",")
    .map((part) => part.trim())
    .some((entry) => {
      const [mediaType, ...params] = entry.split(";").map((p) => p.trim());
      if (mediaType !== MARKDOWN_MEDIA_TYPE) {
        return false;
      }
      const qParam = params.find((p) => p.startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return Number.isFinite(q) && q > 0;
    });
}
