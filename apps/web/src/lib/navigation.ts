import { sanityFetch } from "./sanity/live";
import { queryGlobalSeoSettings, queryNavbarData } from "./sanity/query";

export const getNavigationData = async () => {
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
};
