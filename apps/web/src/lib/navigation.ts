import { unstable_cache } from "next/cache";
import { sanityFetch } from "./sanity/live";
import { queryGlobalSeoSettings, queryNavbarData } from "./sanity/query";

export const getNavigationData = unstable_cache(
  async () => {
    console.time("getNavigationData fetch duration");
    console.debug("Fetching navigation and settings data...");

    const [navbarData, settingsData] = await Promise.all([
      sanityFetch({ query: queryNavbarData }),
      sanityFetch({ query: queryGlobalSeoSettings }),
    ]);

    console.timeEnd("getNavigationData fetch duration");
    console.debug("Navigation data fetched:", navbarData.tags);
    console.debug("Settings data fetched:", settingsData.tags);

    return { navbarData: navbarData.data, settingsData: settingsData.data };
  },
  ["sanity"],
  {
    revalidate: 300, // Revalidate every 5 minutes
  },
);
