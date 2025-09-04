import { unstable_cache } from "next/cache";
import { client } from "./sanity/client";
import { queryGlobalSeoSettings, queryNavbarData } from "./sanity/query";

export const getNavigationData = unstable_cache(
  async () => {
    console.time("getNavigationData fetch duration");
    console.debug("Fetching navigation and settings data...");

    const [navbarData, settingsData] = await Promise.all([
      client.fetch(queryNavbarData),
      client.fetch(queryGlobalSeoSettings),
    ]);

    console.timeEnd("getNavigationData fetch duration");
    console.debug("Navigation data fetched:", navbarData);
    console.debug("Settings data fetched:", settingsData);

    return { navbarData, settingsData };
  },
  ["navigation-data"],
  {
    revalidate: 300, // Revalidate every 5 minutes
  },
);
