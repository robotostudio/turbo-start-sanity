import type { NextConfig } from "next";
import { client } from "@/lib/sanity/client";
import { queryRedirects } from "@/lib/sanity/query";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  experimental: {
    reactCompiler: true,
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
        pathname: `/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/**`,
      },
    ],
  },
  async redirects() {
    const redirects = await client.fetch(queryRedirects);
    return redirects.map((redirect) => ({
      ...redirect,
      permanent: redirect.permanent ?? false,
    }));
  },
};

export default nextConfig;
