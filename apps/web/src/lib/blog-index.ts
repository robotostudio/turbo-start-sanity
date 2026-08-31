import { type DynamicFetchOptions, sanityFetch } from "@workspace/sanity/live";
import { queryBlogIndexPage } from "@workspace/sanity/query";
import type { QueryBlogIndexPageResult } from "@workspace/sanity/types";

import { getBlogPaginationRange } from "@/utils";

/** Far beyond any real archive; bounds the Sanity slice a crafted `?page=`
 * can request and the per-page cache entries it can mint. */
const MAX_BLOG_PAGE = 1000;

/**
 * `?page=` as a 1-based page number, or `null` when present but not a positive
 * integer within bounds — a bogus URL that should 404, not alias page 1.
 */
export function parseBlogPageParam(
  page: string | null | undefined
): number | null {
  if (page === null || page === undefined || page === "") {
    return 1;
  }
  const parsed = Number(page);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_BLOG_PAGE
    ? parsed
    : null;
}

/**
 * The whole blog index page in one cached fetch, shared by the HTML and
 * Markdown routes.
 */
export async function fetchBlogIndexPage({
  currentPage,
  category,
  perspective,
  stega,
}: {
  currentPage: number;
  category: string;
} & DynamicFetchOptions): Promise<QueryBlogIndexPageResult> {
  "use cache";
  const { start, end } = getBlogPaginationRange(currentPage);
  const { data } = await sanityFetch({
    query: queryBlogIndexPage,
    params: { start, end, category },
    perspective,
    stega,
  });
  return data;
}

export type BlogIndexPageData = NonNullable<
  Awaited<ReturnType<typeof fetchBlogIndexPage>>
>;
