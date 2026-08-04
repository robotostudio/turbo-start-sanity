import { env } from "@workspace/env/server";
import { cacheTag } from "next/cache";
import { cookies, draftMode } from "next/headers";
import type { QueryParams } from "next-sanity";
import {
  defineLive,
  type LivePerspective,
  resolvePerspectiveFromCookies,
} from "next-sanity/live";

import { client } from "./client";

/** Learn more: https://github.com/sanity-io/next-sanity?tab=readme-ov-file#1-configure-definelive */
const { sanityFetch: liveFetch, SanityLive } = defineLive({
  client,
  // Required for showing draft content when the Sanity Presentation Tool is used, or to enable the Vercel Toolbar Edit Mode
  serverToken: env.SANITY_API_READ_TOKEN,
  // Required for stand-alone live previews, the token is only shared to the browser if it's a valid Next.js Draft Mode session
  browserToken: env.SANITY_API_READ_TOKEN,
  strict: true,
});

export { SanityLive };

/** `sanityFetch` with the query's sync tags registered on the surrounding
 * `'use cache'` entry. next-sanity only tags the underlying `fetch`, and under
 * `cacheComponents` that never reaches the cache entry — so `updateTag()` from
 * `<SanityLive>` had nothing to invalidate and Presentation served stale HTML.
 * Done here, not per boundary, so a new cached read can't forget. */
export const sanityFetch: typeof liveFetch = async (options) => {
  const result = await liveFetch(options);
  if (result.tags.length > 0) {
    cacheTag(...result.tags);
  }
  return result;
};

export interface DynamicFetchOptions {
  perspective: LivePerspective;
  stega: boolean;
}

const PUBLISHED_FETCH_OPTIONS: DynamicFetchOptions = {
  perspective: "published",
  stega: false,
};

const DRAFTS_FETCH_OPTIONS: DynamicFetchOptions = {
  perspective: "drafts",
  stega: false,
};

const IS_LOCAL_DEV = process.env.NODE_ENV === "development";
const IS_VERCEL_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

/**
 * Where draft content may be rendered at all. Production is always excluded, so
 * it keeps reading published data and prerendering static.
 */
export const DRAFT_MODE_ENABLED = IS_LOCAL_DEV || IS_VERCEL_PREVIEW;

/** Resolves perspective/stega outside any `'use cache'` boundary (reads draftMode/cookies). */
export async function getDynamicFetchOptions(): Promise<DynamicFetchOptions> {
  if (!DRAFT_MODE_ENABLED) {
    return PUBLISHED_FETCH_OPTIONS;
  }
  const { isEnabled: isDraftMode } = await draftMode();
  if (!isDraftMode) {
    // Local dev without a Presentation session still shows drafts, so
    // draft-only pages are visible while developing. Stega stays off here.
    // Preview deployments must NOT take this path: the URL is reachable by
    // anyone Deployment Protection lets through, and serving drafts without a
    // session would publish unreleased content to them. There, a validated
    // draft-mode cookie from /api/presentation-draft is required.
    return IS_LOCAL_DEV ? DRAFTS_FETCH_OPTIONS : PUBLISHED_FETCH_OPTIONS;
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
