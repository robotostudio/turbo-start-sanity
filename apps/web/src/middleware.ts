import { type NextRequest, NextResponse } from "next/server";

import { normalizeMarkdownPath, prefersMarkdown } from "@/lib/markdown-path";

/**
 * Content negotiation for Markdown output.
 *
 * A request is served Markdown when it targets a `.md` URL (e.g. `/about.md`,
 * `/blog/post.md`, `/index.md`) or sends `Accept: text/markdown`. Matching
 * requests are rewritten to the `/api/markdown` route handler; everything else
 * passes through untouched, so normal HTML rendering is unaffected.
 */
export function middleware(request: NextRequest): NextResponse {
  if (request.method !== "GET") {
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

  // For header-based negotiation, ignore requests for asset files (e.g. a
  // `.png` requested with a broad Accept header) — only handle content paths.
  const lastSegment = rawPath.split("/").pop() ?? "";
  if (!hasMdSuffix && lastSegment.includes(".")) {
    return NextResponse.next();
  }

  const contentPath = normalizeMarkdownPath(rawPath);

  // Forward the content path as a header. A rewrite's added query params are
  // not reliably visible on `request.url` in the destination route handler
  // (it still reflects the original URL), but request headers are delivered.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-markdown-path", contentPath);

  const url = request.nextUrl.clone();
  url.pathname = "/api/markdown";
  url.search = "";
  url.searchParams.set("path", contentPath);
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  // Skip API routes, Next internals, and well-known static files. The
  // `/api/markdown` rewrite target is reached internally and bypasses this.
  matcher: ["/((?!api/|_next/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
