import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: [
      {
        find: "@workspace/env/client",
        replacement: path.resolve(
          __dirname,
          "../../packages/sanity-blocks/src/internal/testing/env.mock.ts"
        ),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "src"),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["src/components/**/*.test.{ts,tsx}"],
  },
});
