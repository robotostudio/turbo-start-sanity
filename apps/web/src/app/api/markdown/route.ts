import { Logger } from "@workspace/logger";
import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetch,
} from "@workspace/sanity/live";
import {
  queryAllBlogDataForSearch,
  queryBlogSlugPageData,
  queryHomePageData,
  queryRedirects,
  querySlugPageData,
} from "@workspace/sanity/query";
import { draftMode } from "next/headers";

import { fetchBlogIndexPage, parseBlogPageParam } from "@/lib/blog-index";
import {
  blogIndexToMarkdown,
  blogPostToMarkdown,
  type MarkdownBlogListItem,
  type MarkdownDocument,
  pageToMarkdown,
} from "@/lib/markdown";
import { normalizeMarkdownPath } from "@/lib/markdown-path";
import { calculateBlogPaginationMetadata } from "@/utils";

const logger = new Logger("MarkdownRoute");

const PUBLISHED: DynamicFetchOptions = {
  perspective: "published",
  stega: false,
};

async function fetchHome(options: DynamicFetchOptions) {
  "use cache";
  const { data } = await sanityFetch({
    query: queryHomePageData,
    ...options,
  });
  return data;
}

async function fetchPage(slug: string, options: DynamicFetchOptions) {
  "use cache";
  const { data } = await sanityFetch({
    query: querySlugPageData,
    params: { slug },
    ...options,
  });
  return data;
}

async function fetchBlogPost(slug: string, options: DynamicFetchOptions) {
  "use cache";
  const { data } = await sanityFetch({
    query: queryBlogSlugPageData,
    params: { slug },
    ...options,
  });
  return data;
}

async function fetchAllBlogPosts(options: DynamicFetchOptions) {
  "use cache";
  const { data } = await sanityFetch({
    query: queryAllBlogDataForSearch,
    ...options,
  });
  return data;
}

async function fetchRedirects() {
  "use cache";
  const { data } = await sanityFetch({ query: queryRedirects, ...PUBLISHED });
  return data;
}

/** The blog index's `?page`/`?category`, as forwarded by the proxy. */
type BlogIndexQuery = {
  page: string | null;
  category: string | null;
};

/**
 * One page of the blog index, matching what `/blog?page=…&category=…` renders,
 * off the same cached fetch as the HTML route. Featured posts lead page 1
 * (the query keeps them out of the list; an active category drops them) and
 * flatten with the grid into one `orderRank`-sorted list.
 */
async function buildBlogIndexPageMarkdown(
  query: BlogIndexQuery,
  options: DynamicFetchOptions
): Promise<string | null> {
  const currentPage = parseBlogPageParam(query.page);
  if (currentPage === null) {
    return null;
  }

  const data = await fetchBlogIndexPage({
    currentPage,
    category: query.category ?? "",
    ...options,
  });
  if (!data) {
    return null;
  }

  const { totalPages } = calculateBlogPaginationMetadata(
    data.total,
    currentPage
  );
  // Past the last page is a dead URL, not an empty document. `totalPages`
  // floors at 1, so page 1 of an empty category still renders.
  if (currentPage > totalPages) {
    return null;
  }

  const featured = currentPage === 1 ? data.featuredBlogs : [];
  return blogIndexToMarkdown(data as MarkdownDocument, [
    ...(featured as MarkdownBlogListItem[]),
    ...(data.blogs as MarkdownBlogListItem[]),
  ]);
}

async function buildBlogIndexMarkdown(
  query: BlogIndexQuery,
  options: DynamicFetchOptions
): Promise<string | null> {
  // Bare `/blog.md` is the whole corpus in one document, so LLM consumers get
  // every post in a single fetch; `page`/`category` request a slice instead.
  if (query.page !== null || query.category !== null) {
    return buildBlogIndexPageMarkdown(query, options);
  }

  // Page 1's cache entry doubles as the index document; its post slice is
  // ignored in favour of the full corpus.
  const [index, posts] = await Promise.all([
    fetchBlogIndexPage({ currentPage: 1, category: "", ...options }),
    fetchAllBlogPosts(options),
  ]);
  return index
    ? blogIndexToMarkdown(
        index as MarkdownDocument,
        (posts as MarkdownBlogListItem[] | null) ?? []
      )
    : null;
}

async function buildMarkdown(
  path: string,
  query: BlogIndexQuery,
  options: DynamicFetchOptions
): Promise<string | null> {
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) {
    const data = await fetchHome(options);
    return data ? pageToMarkdown(data as MarkdownDocument) : null;
  }

  if (segments[0] === "blog") {
    if (segments.length === 1) {
      return buildBlogIndexMarkdown(query, options);
    }
    const data = await fetchBlogPost(path, options);
    return data ? blogPostToMarkdown(data as MarkdownDocument) : null;
  }

  const data = await fetchPage(path, options);
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

async function resolveFetchOptions(): Promise<DynamicFetchOptions> {
  const { isEnabled } = await draftMode();
  if (!isEnabled) {
    return PUBLISHED;
  }
  // Perspective follows draft mode, but stega stays off: its invisible
  // metadata characters would end up inside the copied Markdown.
  return { ...(await getDynamicFetchOptions()), stega: false };
}

/**
 * Reads a value the proxy forwarded. The `x-markdown-*` header wins — a
 * rewrite's query params aren't reliably visible on `request.url` downstream;
 * the URL is the fallback for a direct hit on this route. Header values are
 * percent-encoded; a malformed one (hand-rolled request) passes through as-is.
 */
function readForwarded(
  request: Request,
  url: URL,
  name: string
): string | null {
  const header = request.headers.get(`x-markdown-${name}`);
  if (header === null) {
    return url.searchParams.get(name);
  }
  try {
    return decodeURIComponent(header);
  } catch {
    return header;
  }
}

/** The Markdown representation's own URL (`.md` suffix, `/` → `/index.md`)
 * plus the params that shaped this doc, for `Content-Location`. */
function representationOf(path: string, query: BlogIndexQuery): string {
  const mdPath = path === "/" ? "/index.md" : `${path}.md`;
  const params = new URLSearchParams();
  if (query.page !== null) {
    params.set("page", query.page);
  }
  if (query.category !== null) {
    params.set("category", query.category);
  }
  const search = params.toString();
  return search ? `${mdPath}?${search}` : mdPath;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = normalizeMarkdownPath(
    readForwarded(request, url, "path") ?? "/"
  );
  const query: BlogIndexQuery = {
    page: readForwarded(request, url, "page"),
    category: readForwarded(request, url, "category"),
  };

  const options = await resolveFetchOptions();
  const isDraft = options.perspective !== "published";

  let markdown: string | null;
  try {
    markdown = await buildMarkdown(path, query, options);
  } catch (error) {
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
        vary: "Accept",
        "content-location": representationOf(path, query),
        "x-robots-tag": "noindex, nofollow",
        "x-content-type-options": "nosniff",
        "cache-control": isDraft
          ? "private, no-store"
          : "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  try {
    const redirect = await findRedirect(path);
    if (redirect) {
      const requestUrl = new URL(request.url);
      const target = new URL(redirect.destination, requestUrl);
      if (target.origin === requestUrl.origin) {
        const normalized = normalizeMarkdownPath(target.pathname);
        target.pathname = normalized === "/" ? "/index.md" : `${normalized}.md`;
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
    return new Response("Upstream content fetch failed\n", {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        vary: "Accept",
        "x-content-type-options": "nosniff",
      },
    });
  }

  return new Response(`Not found: ${representationOf(path, query)}\n`, {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      vary: "Accept",
      "x-content-type-options": "nosniff",
    },
  });
}
