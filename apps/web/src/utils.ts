import { env } from "@workspace/env/client";

export const getBaseUrl = () => {
  // Checked first: the Vercel vars below exist only on Vercel.
  if (env.NEXT_PUBLIC_SITE_URL) {
    return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

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

// Blog cards in the grid list on every page — the featured card on page 1 sits
// above these and is counted separately by the helpers below.
const BLOG_LIST_PAGE_SIZE = 9;

/** GROQ slice window `[start, end)` into the ordered blog list for a page. */
export function getBlogPaginationRange(page: number): {
  start: number;
  end: number;
} {
  const start = Math.max(page - 1, 0) * BLOG_LIST_PAGE_SIZE;
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
 * Derive pagination metadata for the blog index. `totalItems` counts list
 * documents only — the count query applies the same featured exclusion the list
 * query does, so featured posts never inflate the page count.
 */
export function calculateBlogPaginationMetadata(
  totalItems: number,
  currentPage: number
): PaginationMetadata {
  const totalPages = Math.max(1, Math.ceil(totalItems / BLOG_LIST_PAGE_SIZE));
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
