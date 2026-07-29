import { env } from "@workspace/env/server";
import { cookies, draftMode } from "next/headers";
import type { QueryParams } from "next-sanity";
import {
  defineLive,
  type LivePerspective,
  resolvePerspectiveFromCookies,
} from "next-sanity/live";

import { client } from "./client";

/**
 * Use defineLive to enable automatic revalidation and refreshing of your fetched content
 * Learn more: https://github.com/sanity-io/next-sanity?tab=readme-ov-file#1-configure-definelive
 */
export const { sanityFetch, SanityLive } = defineLive({
  client,
  // Required for showing draft content when the Sanity Presentation Tool is used, or to enable the Vercel Toolbar Edit Mode
  serverToken: env.SANITY_API_READ_TOKEN,
  // Required for stand-alone live previews, the token is only shared to the browser if it's a valid Next.js Draft Mode session
  browserToken: env.SANITY_API_READ_TOKEN,
  strict: true,
});

export type DynamicFetchOptions = {
  perspective: LivePerspective;
  stega: boolean;
};

const PUBLISHED_FETCH_OPTIONS: DynamicFetchOptions = {
  perspective: "published",
  stega: false,
};

const DRAFTS_FETCH_OPTIONS: DynamicFetchOptions = {
  perspective: "drafts",
  stega: false,
};

/**
 * Draft-mode preview is local-dev only. In production this is `false`, so the
 * helpers below never read `draftMode()` and pages prerender fully static
 * (published) — no streaming, no skeletons, instant navigation.
 */
export const DRAFT_MODE_ENABLED = process.env.NODE_ENV === "development";

/** Resolves perspective/stega outside any `'use cache'` boundary (reads draftMode/cookies). */
export async function getDynamicFetchOptions(): Promise<DynamicFetchOptions> {
  if (!DRAFT_MODE_ENABLED) {
    return PUBLISHED_FETCH_OPTIONS;
  }
  const { isEnabled: isDraftMode } = await draftMode();
  if (!isDraftMode) {
    // Dev without a Presentation session still shows drafts, so draft-only
    // pages are visible while developing. Stega stays off here.
    return DRAFTS_FETCH_OPTIONS;
  }

  const jar = await cookies();
  const perspective = await resolvePerspectiveFromCookies({ cookies: jar });
  return { perspective: perspective ?? "drafts", stega: true };
}

/**
 * Perspective/stega for a page route's inner (post-Suspense) component:
 * published in production (stays static), drafts in dev. Must be called outside
 * any `'use cache'` boundary (reads draftMode).
 */
export async function resolvePageFetchOptions(): Promise<DynamicFetchOptions> {
  if (!DRAFT_MODE_ENABLED) {
    return PUBLISHED_FETCH_OPTIONS;
  }
  return getDynamicFetchOptions();
}

/** For usage within `generateStaticParams` only. */
export async function sanityFetchStaticParams<
  const QueryString extends string,
>({ query, params = {} }: { query: QueryString; params?: QueryParams }) {
  "use cache";
  const { data } = await sanityFetch({
    query,
    params,
    perspective: "published",
    stega: false,
  });
  return { data };
}

/** For `generateMetadata`, `sitemap.ts`, `robots.ts`, etc. (no stega; pass perspective). */
export async function sanityFetchMetadata<const QueryString extends string>({
  query,
  params = {},
  perspective,
}: {
  query: QueryString;
  params?: QueryParams;
  perspective: LivePerspective;
}) {
  "use cache";
  const { data } = await sanityFetch({
    query,
    params,
    perspective,
    stega: false,
  });
  return { data };
}
