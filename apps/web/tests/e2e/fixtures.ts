import { test as base } from "@playwright/test";
import { createClient } from "@sanity/client";

interface SlugPages {
  pages: string[];
  blogs: string[];
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

if (!projectId || !dataset) {
  throw new Error(
    "Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET",
  );
}

const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01",
  useCdn: true,
});

function sanitizeSlugs(slugs: string[]): string[] {
  const cleaned = slugs
    .filter((s) => typeof s === "string" && s.length > 0)
    .map((s) => (s.endsWith("/") ? s.slice(0, -1) : s));

  return [...new Set(cleaned)];
}

export const test = base.extend<{ slugPages: SlugPages }>({
  slugPages: async ({}, use) => {
    const result = await sanityClient.fetch<SlugPages>(`{
      "pages": *[_type == "page" && defined(slug.current)].slug.current,
      "blogs": *[_type == "blog" && defined(slug.current)].slug.current
    }`);

    await use({
      pages: sanitizeSlugs(result.pages ?? []),
      blogs: sanitizeSlugs(result.blogs ?? []),
    });
  },
});

export { expect } from "@playwright/test";
