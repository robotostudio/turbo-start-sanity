import { env } from "@workspace/env/client";

export const getBaseUrl = () => {
  if (env.NEXT_PUBLIC_VERCEL_ENV === "production") {
    return env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  }

  if (env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
    return env.NEXT_PUBLIC_VERCEL_URL;
  }

  return "http://localhost:3000";
};

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Placeholder slug returned from `generateStaticParams` when no real paths
 * exist yet, so the dynamic route still prerenders a shell.
 */
export const PLACEHOLDER_SLUG = "__placeholder__";

/**
 * Formats an ISO date string as `Mon D, YYYY` (en-US). Returns `null` for
 * missing or unparseable values so callers can skip rendering.
 */
export function formatDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Response<T> = [T, undefined] | [undefined, string];

export async function handleErrors<T>(
  promise: Promise<T>
): Promise<Response<T>> {
  try {
    const data = await promise;
    return [data, undefined];
  } catch (err) {
    return [
      undefined,
      err instanceof Error ? err.message : JSON.stringify(err),
    ];
  }
}

// Number of blog cards rendered in the grid list on every page. On page 1 the
// full-width featured card sits above these, so page 1 consumes one extra
// document (1 featured + BLOG_LIST_PAGE_SIZE list = 10 docs). Every later page
// shows BLOG_LIST_PAGE_SIZE (9) list docs only.
const BLOG_LIST_PAGE_SIZE = 9;

/**
 * GROQ slice window `[start, end)` into the full ordered blog list for a given
 * page. When `hasFeatured` is true the featured card occupies document 0 on
 * page 1, so page 1 fetches BLOG_LIST_PAGE_SIZE + 1 documents and every later
 * page is offset by that single featured document.
 */
export function getBlogPaginationRange(
  page: number,
  hasFeatured: boolean
): { start: number; end: number } {
  const featuredOffset = hasFeatured ? 1 : 0;

  if (page <= 1) {
    return { start: 0, end: featuredOffset + BLOG_LIST_PAGE_SIZE };
  }

  const start = featuredOffset + (page - 1) * BLOG_LIST_PAGE_SIZE;
  return { start, end: start + BLOG_LIST_PAGE_SIZE };
}

export type PaginationMetadata = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

/**
 * Derive pagination metadata for the blog index. The featured card (when
 * present) is one of the total documents but is not a list item, so the page
 * count is based on the remaining list documents at BLOG_LIST_PAGE_SIZE each.
 */
export function calculateBlogPaginationMetadata(
  totalItems: number,
  currentPage: number,
  hasFeatured: boolean
): PaginationMetadata {
  const featuredOffset = hasFeatured ? 1 : 0;
  const listItems = Math.max(totalItems - featuredOffset, 0);
  const totalPages = Math.max(1, Math.ceil(listItems / BLOG_LIST_PAGE_SIZE));
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: BLOG_LIST_PAGE_SIZE,
    hasNextPage,
    hasPreviousPage,
  };
}
