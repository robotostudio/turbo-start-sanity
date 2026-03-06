import "@workspace/env/client";
import "@workspace/env/server";

import { env } from "@workspace/env/client";
import type { NextConfig } from "next";

import { client } from "@/lib/sanity/client";
import { queryRedirects } from "@/lib/sanity/query";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/opensearch"],
  reactCompiler: true,
  experimental: {
    inlineCss: true,
  },
  logging: {
    fetches: {},
  },
  images: {
    minimumCacheTTL: 31_536_000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: `/images/${env.NEXT_PUBLIC_SANITY_PROJECT_ID}/**`,
      },
    ],
  },
  async redirects() {
    try {
      const redirects = await client.fetch(queryRedirects);
      return redirects.map((redirect) => ({
        source: redirect.source,
        destination: redirect.destination,
        permanent: redirect.permanent ?? false,
      }));
    } catch (error) {
      console.warn("[next.config] Failed to fetch redirects from Sanity:", error);
      return [];
    }
  },
};

export default nextConfig;
