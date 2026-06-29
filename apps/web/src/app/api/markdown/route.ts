import { Logger } from "@workspace/logger";
import { sanityFetch } from "@workspace/sanity/live";
import {
  queryAllBlogDataForSearch,
  queryBlogIndexPageData,
  queryBlogSlugPageData,
  queryHomePageData,
  queryRedirects,
  querySlugPageData,
} from "@workspace/sanity/query";

import {
  blogIndexToMarkdown,
  blogPostToMarkdown,
  type MarkdownBlogListItem,
  type MarkdownDocument,
  pageToMarkdown,
} from "@/lib/markdown";
import { normalizeMarkdownPath } from "@/lib/markdown-path";

const logger = new Logger("MarkdownRoute");

const PUBLISHED = { perspective: "published", stega: false } as const;

// sanityFetch calls cacheTag()/cacheLife() internally, so every call must run
// inside a `"use cache"` scope (mirrors the page components). The dynamic
// header read stays in GET, outside these cached helpers.

async function fetchHome() {
  "use cache";
  const { data } = await sanityFetch({
    query: queryHomePageData,
    ...PUBLISHED,
  });
  return data;
}

async function fetchPage(slug: string) {
  "use cache";
  const { data } = await sanityFetch({
    query: querySlugPageData,
    params: { slug },
    ...PUBLISHED,
  });
  return data;
}

async function fetchBlogPost(slug: string) {
  "use cache";
  const { data } = await sanityFetch({
    query: queryBlogSlugPageData,
    params: { slug },
    ...PUBLISHED,
  });
  return data;
}

async function fetchBlogIndex() {
  "use cache";
  const [{ data: index }, { data: posts }] = await Promise.all([
    sanityFetch({ query: queryBlogIndexPageData, ...PUBLISHED }),
    sanityFetch({ query: queryAllBlogDataForSearch, ...PUBLISHED }),
  ]);
  return { index, posts };
}

async function fetchRedirects() {
  "use cache";
  const { data } = await sanityFetch({ query: queryRedirects, ...PUBLISHED });
  return data;
}

async function buildMarkdown(path: string): Promise<string | null> {
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) {
    const data = await fetchHome();
    return data ? pageToMarkdown(data as MarkdownDocument) : null;
  }

  if (segments[0] === "blog") {
    if (segments.length === 1) {
      const { index, posts } = await fetchBlogIndex();
      return index
        ? blogIndexToMarkdown(
            index as MarkdownDocument,
            (posts as MarkdownBlogListItem[] | null) ?? []
          )
        : null;
    }
    const data = await fetchBlogPost(path);
    return data ? blogPostToMarkdown(data as MarkdownDocument) : null;
  }

  const data = await fetchPage(path);
  return data ? pageToMarkdown(data as MarkdownDocument) : null;
}

async function findRedirect(
  path: string
): Promise<{ destination: string; permanent: boolean } | null> {
  const data = await fetchRedirects();
  const match = (data ?? []).find((redirect) => redirect.source === path);
  return match
    ? { destination: match.destination, permanent: match.permanent ?? false }
    : null;
}

export async function GET(request: Request): Promise<Response> {
  // The middleware forwards the requested page path as a header (reliable
  // across a rewrite). The `?path=` query is a fallback for direct calls.
  const headerPath = request.headers.get("x-markdown-path");
  const queryPath = new URL(request.url).searchParams.get("path");
  const path = normalizeMarkdownPath(headerPath ?? queryPath ?? "/");

  let markdown: string | null;
  try {
    markdown = await buildMarkdown(path);
  } catch (error) {
    // A fetch/transport failure must not masquerade as a missing page (which
    // crawlers and CDNs would treat as permanently deleted).
    logger.error("Markdown build failed", error);
    return new Response("Upstream content fetch failed\n", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (markdown) {
    return new Response(markdown, {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        // The same URL serves HTML or Markdown depending on `Accept`, so the
        // cache key must include it to avoid serving one variant for the other.
        vary: "Accept",
        // Point bots at the canonical HTML page and keep the Markdown twin out
        // of search results so it doesn't compete with it.
        "content-location": path,
        "x-robots-tag": "noindex, nofollow",
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  // No document for this path — honor Sanity-managed redirects (whose source
  // paths never carry a `.md` suffix) before returning 404.
  try {
    const redirect = await findRedirect(path);
    if (redirect) {
      const target = redirect.destination.endsWith(".md")
        ? redirect.destination
        : `${redirect.destination}.md`;
      return Response.redirect(
        new URL(target, request.url),
        redirect.permanent ? 308 : 307
      );
    }
  } catch (error) {
    logger.error("Redirect lookup failed", error);
  }

  return new Response(`Not found: ${path}\n`, {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
