import { env } from "@workspace/env/client";
import type { PortableTextBlock } from "next-sanity";
import slugify from "slugify";

export const getBaseUrl = () => {
  if (env.NEXT_PUBLIC_VERCEL_ENV === "production") {
    return env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  }

  if (env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
    return env.NEXT_PUBLIC_VERCEL_URL;
  }

  return "http://localhost:3000";
};

export const isRelativeUrl = (url: string) =>
  url.startsWith("/") || url.startsWith("#") || url.startsWith("?");

export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (_e) {
    return isRelativeUrl(url);
  }
};

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const getTitleCase = (name: string) => {
  const titleTemp = name.replace(/([A-Z])/g, " $1");
  return titleTemp.charAt(0).toUpperCase() + titleTemp.slice(1);
};

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

export function convertToSlug(
  text?: string,
  { fallback }: { fallback?: string } = { fallback: "top-level" }
) {
  if (!text) {
    return fallback;
  }
  return slugify(text.trim(), {
    lower: true,
    remove: /[^a-zA-Z0-9 ]/g,
  });
}

export function parseChildrenToSlug(children: PortableTextBlock["children"]) {
  if (!children) {
    return "";
  }
  return convertToSlug(children.map((child) => child.text).join(""));
}

const BLOG_ITEMS_PER_PAGE = 10;

export function getBlogPaginationStartEnd(page: number): {
  start: number;
  end: number;
} {
  const start = (page - 1) * BLOG_ITEMS_PER_PAGE;
  const end = start + BLOG_ITEMS_PER_PAGE;
  return { start, end };
}

export type PaginationMetadata = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function calculatePaginationMetadata(
  totalItems: number,
  currentPage = 1,
  itemsPerPage = BLOG_ITEMS_PER_PAGE
): PaginationMetadata {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage,
    hasPreviousPage,
  };
}
