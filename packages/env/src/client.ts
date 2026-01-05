import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },

  client: {
    /** Vercel System (Framework) Vars: Auto-injected in Prod/Preview, missing locally
     *  Learn more: https://vercel.com/docs/environment-variables/framework-environment-variables#using-prefixed-framework-environment-variables-locally)
     */

    NEXT_PUBLIC_VERCEL_ENV: z
      .enum(["production", "preview", "development"])
      .default("development"),
    NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: z
      .string()
      .default("localhost:3000")
      .transform((url) => {
        if (url.includes("localhost")) {
          return `http://${url}`;
        }
        return `https://${url}`;
      }),
    NEXT_PUBLIC_VERCEL_URL: z
      .string()
      .default("localhost:3000")
      .transform((url) => {
        if (url.includes("localhost")) {
          return `http://${url}`;
        }
        return `https://${url}`;
      }),

    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
    NEXT_PUBLIC_SANITY_API_VERSION: z.string().min(1),
    NEXT_PUBLIC_SANITY_STUDIO_URL: z.url().min(1),
  },

  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,

    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
    NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL:
      process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,

    NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
    NEXT_PUBLIC_SANITY_STUDIO_URL: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
});

export { env };
