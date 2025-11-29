import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const jiti = createJiti(fileURLToPath(import.meta.url), {
  alias: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
    "@workspace/ui/*": fileURLToPath(
      new URL("../../packages/ui/src", import.meta.url)
    ),
    env: fileURLToPath(new URL("./env", import.meta.url)),
  },
  interopDefault: true,
  sourceMaps: process.env.NODE_ENV === "development",
});

await jiti.import("env");

/**
 * @typedef {import("@sanity/client").SanityClient} SanityClient
 */

const clientModule =
  /** @type {{client: SanityClient; urlFor: (source: import("@sanity/asset-utils").SanityImageSource) => string}} */ (
    await jiti.import("@/lib/sanity/client")
  );
const queryResultModule = /** @type {{queryRedirects: string}} */ (
  await jiti.import("@/lib/sanity/query")
);

const { client } = clientModule;
const { queryRedirects } = queryResultModule;

/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
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
        pathname: `/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/**`,
      },
    ],
  },
  async redirects() {
    const redirects = await client.fetch(queryRedirects);
    return redirects.map(
      (
        /** @type {{ source: string; destination: string; permanent?: boolean }} */ redirect
      ) => ({
        source: redirect.source,
        destination: redirect.destination,
        permanent: redirect.permanent ?? false,
      })
    );
  },
};

export default nextConfig;
