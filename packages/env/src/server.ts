import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v4";

const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },

  server: {
    SANITY_API_READ_TOKEN: z.string().min(1),
    SANITY_API_WRITE_TOKEN: z.string().min(1),
    // Shared secret for the `/api/revalidate-sync-tags` webhook. Optional so
    // existing deployments still boot; the webhook fails closed when unset.
    SANITY_REVALIDATE_SECRET: z.string().min(1).optional(),
    // Preview-only escape hatch: when "true", the plain URL renders draft
    // content (no Presentation / draft-mode cookie needed) so a preview
    // deployment can be shared for review. NEVER set this in production — it
    // exposes unpublished content to anyone with the link.
    SANITY_PREVIEW_FORCE_DRAFTS: z
      .string()
      .optional()
      .transform((value) => value === "true"),
  },

  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
  },

  extends: [vercel()],
});

export { env };
