import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: [
      {
        find: "@workspace/env/client",
        replacement: path.resolve(
          configDirectory,
          "../../packages/sanity-blocks/src/internal/testing/env.mock.ts"
        ),
      },
      {
        find: "@",
        replacement: path.resolve(configDirectory, "src"),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["src/components/**/*.test.{ts,tsx}"],
  },
});
