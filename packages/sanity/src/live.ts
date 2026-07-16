import { env } from "@workspace/env/server";
import { cookies, draftMode } from "next/headers";
import { connection } from "next/server";
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

// TEMP(preview-drafts): render draft content on ALL Vercel Preview deployments
// so the shared preview URL can be reviewed without Presentation / draft-mode.
// `VERCEL_ENV` is set by Vercel at build AND runtime ("preview" | "production" |
// "development"); production stays on published. The manual
// SANITY_PREVIEW_FORCE_DRAFTS flag still works (e.g. locally). REMOVE this whole
// force-drafts mechanism (this const, the getDynamicFetchOptions branch, and the
// `previewForceDrafts` uses in pages/layout) before merging.
export const previewForceDrafts =
  process.env.SANITY_PREVIEW_FORCE_DRAFTS === "true" ||
  process.env.VERCEL_ENV === "preview";

/** Resolves perspective/stega outside any `'use cache'` boundary (reads draftMode/cookies). */
export async function getDynamicFetchOptions(): Promise<DynamicFetchOptions> {
  const { isEnabled: isDraftMode } = await draftMode();
  if (!isDraftMode) {
    if (previewForceDrafts) {
      // TEMP(preview-drafts): opt out of the published prerender and render this
      // request dynamically so the preview reflects the CURRENT drafts.
      await connection();
      return { perspective: "drafts", stega: false };
    }
    return { perspective: "published", stega: false };
  }

  const jar = await cookies();
  const perspective = await resolvePerspectiveFromCookies({ cookies: jar });
  return { perspective: perspective ?? "drafts", stega: true };
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
