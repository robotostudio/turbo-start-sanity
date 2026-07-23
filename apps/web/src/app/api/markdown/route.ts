import { Logger } from "@workspace/logger";
import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  previewForceDrafts,
  sanityFetch,
} from "@workspace/sanity/live";
import {
  queryAllBlogDataForSearch,
  queryBlogIndexPageData,
  queryBlogSlugPageData,
  queryHomePageData,
  queryRedirects,
  querySlugPageData,
} from "@workspace/sanity/query";
import { draftMode } from "next/headers";

import {
  blogIndexToMarkdown,
  blogPostToMarkdown,
  type MarkdownBlogListItem,
  type MarkdownDocument,
  pageToMarkdown,
} from "@/lib/markdown";
import { normalizeMarkdownPath } from "@/lib/markdown-path";

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

async function fetchBlogIndex(options: DynamicFetchOptions) {
  "use cache";
  const [{ data: index }, { data: posts }] = await Promise.all([
    sanityFetch({ query: queryBlogIndexPageData, ...options }),
    sanityFetch({ query: queryAllBlogDataForSearch, ...options }),
  ]);
  return { index, posts };
}

async function fetchRedirects() {
  "use cache";
  const { data } = await sanityFetch({ query: queryRedirects, ...PUBLISHED });
  return data;
}

async function buildMarkdown(
  path: string,
  options: DynamicFetchOptions
): Promise<string | null> {
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) {
    const data = await fetchHome(options);
    return data ? pageToMarkdown(data as MarkdownDocument) : null;
  }

  if (segments[0] === "blog") {
    if (segments.length === 1) {
      const { index, posts } = await fetchBlogIndex(options);
      return index
        ? blogIndexToMarkdown(
            index as MarkdownDocument,
            (posts as MarkdownBlogListItem[] | null) ?? []
          )
        : null;
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
  if (!(isEnabled || previewForceDrafts)) {
    return PUBLISHED;
  }
  // Perspective follows draft mode, but stega stays off: its invisible
  // metadata characters would end up inside the copied Markdown.
  return { ...(await getDynamicFetchOptions()), stega: false };
}

export async function GET(request: Request): Promise<Response> {
  const headerPath = request.headers.get("x-markdown-path");
  const queryPath = new URL(request.url).searchParams.get("path");
  const path = normalizeMarkdownPath(headerPath ?? queryPath ?? "/");

  const options = await resolveFetchOptions();
  const isDraft = options.perspective !== "published";

  let markdown: string | null;
  try {
    markdown = await buildMarkdown(path, options);
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
        "content-location": path,
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

  return new Response(`Not found: ${path}\n`, {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      vary: "Accept",
      "x-content-type-options": "nosniff",
    },
  });
}
