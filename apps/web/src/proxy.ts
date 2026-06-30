import { type NextRequest, NextResponse } from "next/server";

import { normalizeMarkdownPath, prefersMarkdown } from "@/lib/markdown-path";

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

  // Forward the path as a header — a rewrite's query params aren't reliably
  // visible on `request.url` downstream, but request headers are.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-markdown-path", contentPath);

  const url = request.nextUrl.clone();
  url.pathname = "/api/markdown";
  url.search = "";
  url.searchParams.set("path", contentPath);
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!api/|_next/|favicon.ico|robots.txt|sitemap.xml|llms\\.txt).*)",
  ],
};
