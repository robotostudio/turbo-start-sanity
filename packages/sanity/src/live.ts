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

/**
 * Serve drafts to a request that carries no Presentation session. Local dev
 * only: anywhere the URL is publicly reachable this would hand unpublished
 * content to anyone who can load the page.
 */
export const DRAFTS_WITHOUT_SESSION = process.env.NODE_ENV === "development";

/**
 * Resolves perspective/stega outside any `'use cache'` boundary (reads
 * draftMode/cookies).
 *
 * Drafts may render in any environment — including production — but only for a
 * request holding a draft-mode session. `/api/presentation-draft` is the only
 * way to obtain one and it validates a Sanity preview secret, so an anonymous
 * request still resolves to published content and renders statically.
 * Gating on the session rather than on the environment is what lets the
 * deployed Studio's Presentation tool preview the production site.
 */
export async function getDynamicFetchOptions(): Promise<DynamicFetchOptions> {
  const { isEnabled: isDraftMode } = await draftMode();
  if (!isDraftMode) {
    return DRAFTS_WITHOUT_SESSION
      ? DRAFTS_FETCH_OPTIONS
      : PUBLISHED_FETCH_OPTIONS;
  }

  const jar = await cookies();
  const perspective = await resolvePerspectiveFromCookies({ cookies: jar });
  return { perspective: perspective ?? "drafts", stega: true };
}

/**
 * Perspective/stega for a page route's inner (post-Suspense) component. Must be
 * called outside any `'use cache'` boundary (reads draftMode).
 */
export async function resolvePageFetchOptions(): Promise<DynamicFetchOptions> {
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
