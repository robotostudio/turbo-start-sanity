import { sanityFetch } from "@workspace/sanity/live";
import {
  queryBlogPageOGData,
  queryGenericPageOGData,
  queryHomePageOGData,
  querySlugPageOGData,
} from "@workspace/sanity/query";

import { handleErrors } from "@/utils";

// Fetch via `sanityFetch` in `"use cache"` so OG data carries `sanity:*` tags
// and the sync-tag webhook can revalidate it (`client.fetch` is untagged).
const PUBLISHED = { perspective: "published", stega: false } as const;

async function fetchHomePageOG(id: string) {
  "use cache";
  const { data } = await sanityFetch({
    query: queryHomePageOGData,
    params: { id },
    ...PUBLISHED,
  });
  return data;
}

async function fetchSlugPageOG(id: string) {
  "use cache";
  const { data } = await sanityFetch({
    query: querySlugPageOGData,
    params: { id },
    ...PUBLISHED,
  });
  return data;
}

async function fetchBlogPageOG(id: string) {
  "use cache";
  const { data } = await sanityFetch({
    query: queryBlogPageOGData,
    params: { id },
    ...PUBLISHED,
  });
  return data;
}

async function fetchGenericPageOG(id: string) {
  "use cache";
  const { data } = await sanityFetch({
    query: queryGenericPageOGData,
    params: { id },
    ...PUBLISHED,
  });
  return data;
}

export async function getHomePageOGData(id: string) {
  return await handleErrors(fetchHomePageOG(id));
}

export async function getSlugPageOGData(id: string) {
  return await handleErrors(fetchSlugPageOG(id));
}

export async function getBlogPageOGData(id: string) {
  return await handleErrors(fetchBlogPageOG(id));
}

export async function getGenericPageOGData(id: string) {
  return await handleErrors(fetchGenericPageOG(id));
}
