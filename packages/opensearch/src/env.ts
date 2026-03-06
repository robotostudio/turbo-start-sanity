import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const opensearchEnv = createEnv({
  server: {
    OPENSEARCH_URL: z
      .string()
      .url()
      .default("http://localhost:9200"),
    OPENSEARCH_USERNAME: z.string().optional(),
    OPENSEARCH_PASSWORD: z.string().optional(),
    OPENSEARCH_INDEX: z.string().default("blogs"),
    SANITY_WEBHOOK_SECRET: z.string().min(1).optional(),
  },
  experimental__runtimeEnv: {},
});
