import { type DynamicFetchOptions, sanityFetch } from "@workspace/sanity/live";
import {
  queryGlobalSeoSettings,
  queryNavbarData,
} from "@workspace/sanity/query";

export async function getNavigationData({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const [navbarData, settingsData] = await Promise.all([
    sanityFetch({ query: queryNavbarData, perspective, stega }),
    sanityFetch({ query: queryGlobalSeoSettings, perspective, stega }),
  ]);

  return { navbarData: navbarData.data, settingsData: settingsData.data };
}
