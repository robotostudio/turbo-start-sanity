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
    ? { destination: match.destination, permanent: match.permanent }
    : null;
}

export async function GET(request: Request): Promise<Response> {
  // Path comes from the proxy header (survives the rewrite); `?path=` is a
  // fallback for direct calls.
  const headerPath = request.headers.get("x-markdown-path");
  const queryPath = new URL(request.url).searchParams.get("path");
  const path = normalizeMarkdownPath(headerPath ?? queryPath ?? "/");

  let markdown: string | null;
  try {
    markdown = await buildMarkdown(path);
  } catch (error) {
    // A fetch failure must not look like a missing page (crawlers treat 404 as gone).
    logger.error("Markdown build failed", error);
    return new Response("Upstream content fetch failed\n", {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        vary: "Accept",
        "x-content-type-options": "nosniff",
      },
    });
  }

  if (markdown) {
    return new Response(markdown, {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        // Same URL serves HTML or Markdown by Accept — cache must key on it.
        vary: "Accept",
        // Canonical HTML page; keep the Markdown twin out of search.
        "content-location": path,
        "x-robots-tag": "noindex, nofollow",
        "x-content-type-options": "nosniff",
        // Short TTL: the Sanity fetch is tag-revalidated via `"use cache"`, but
        // this rendered response isn't tag-purged, so bound CDN drift.
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  // No document for this path — honor Sanity redirects before returning 404.
  try {
    const redirect = await findRedirect(path);
    if (redirect) {
      // Parse so a destination's query/hash survive; only the pathname gets `.md`.
      const requestUrl = new URL(request.url);
      const target = new URL(redirect.destination, requestUrl);
      // Same-origin only: a protocol-relative `//evil.com` (allowed by the
      // schema's `startsWith("/")`) would redirect off-site. External → 404.
      if (target.origin === requestUrl.origin) {
        if (!target.pathname.endsWith(".md")) {
          target.pathname = `${target.pathname}.md`;
        }
        return new Response(null, {
          status: redirect.permanent ? 308 : 307,
          headers: {
            location: target.toString(),
            vary: "Accept",
            "x-content-type-options": "nosniff",
          },
        });
      }
    }
  } catch (error) {
    logger.error("Redirect lookup failed", error);
  }

  return new Response(`Not found: ${path}\n`, {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      vary: "Accept",
      "x-content-type-options": "nosniff",
    },
  });
}
