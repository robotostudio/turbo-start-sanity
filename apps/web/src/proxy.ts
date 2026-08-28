import { type NextRequest, NextResponse } from "next/server";

import { normalizeMarkdownPath, prefersMarkdown } from "@/lib/markdown-path";

/** Query params the Markdown route honours — blog index pagination + filter. */
const FORWARDED_PARAMS = ["page", "category"] as const;

/**
 * Content negotiation for Markdown: a `.md` URL or `Accept: text/markdown` is
 * rewritten to the `/api/markdown` route handler; everything else passes through.
 * The Markdown route sets `Vary: Accept` so a shared cache never serves Markdown
 * to a browser; App Router HTML pages can't carry it (Next owns that header), so
 * the `.md` suffix is the cache-safe surface.
 */
export function proxy(request: NextRequest): NextResponse {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const hasMdSuffix = pathname.endsWith(".md");
  const wantsMarkdown =
    hasMdSuffix || prefersMarkdown(request.headers.get("accept") ?? "");

  if (!wantsMarkdown) {
    return NextResponse.next();
  }

  const rawPath = hasMdSuffix ? pathname.slice(0, -3) : pathname;

  // Header negotiation: skip asset files (e.g. a `.png` with a broad Accept).
  const lastSegment = rawPath.split("/").pop() ?? "";
  if (!hasMdSuffix && lastSegment.includes(".")) {
    return NextResponse.next();
  }

  const contentPath = normalizeMarkdownPath(rawPath);

  // Forwarded as headers: a rewrite's query params aren't reliably visible on
  // `request.url` downstream. Percent-encoded because a query param can hold
  // newlines and control bytes, which a header value cannot.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-markdown-path", encodeURIComponent(contentPath));
  for (const param of FORWARDED_PARAMS) {
    const value = request.nextUrl.searchParams.get(param);
    // Set-or-delete, so a client-sent `x-markdown-page` can never outrank the
    // URL the request actually asked for.
    if (value === null) {
      requestHeaders.delete(`x-markdown-${param}`);
    } else {
      requestHeaders.set(`x-markdown-${param}`, encodeURIComponent(value));
    }
  }

  // The incoming query string rides along untouched as the headers' fallback.
  const url = request.nextUrl.clone();
  url.pathname = "/api/markdown";
  url.searchParams.set("path", contentPath);
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api/|_next/|robots.txt|sitemap.xml|llms[.]txt).*)"],
};
