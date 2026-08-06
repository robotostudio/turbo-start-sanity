import { type DynamicFetchOptions, sanityFetch } from "@workspace/sanity/live";
import {
  queryGlobalSeoSettings,
  queryNavbarData,
} from "@workspace/sanity/query";

/** The Settings singleton as its own cache entry, so the navbar and footer
 * share one fetch instead of baking private copies into their boundaries.
 * Sync tags still reach both callers — Next propagates a nested `'use cache'`
 * entry's tags to the enclosing one, on hit as well as on miss. */
export async function getGlobalSettings({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const { data } = await sanityFetch({
    query: queryGlobalSeoSettings,
    perspective,
    stega,
  });
  return data;
}

export async function getNavigationData({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const [navbarData, settingsData] = await Promise.all([
    sanityFetch({ query: queryNavbarData, perspective, stega }),
    getGlobalSettings({ perspective, stega }),
  ]);

  return { navbarData: navbarData.data, settingsData };
}
