import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@workspace\/sanity-blocks$/,
        replacement: path.resolve(__dirname, "src/sanity-blocks.ts"),
      },
      {
        find: /^@workspace\/sanity-blocks\/(.*)$/,
        replacement: `${path.resolve(__dirname, "src")}/$1`,
      },
      {
        find: /^@workspace\/env\/client$/,
        replacement: path.resolve(
          __dirname,
          "src/internal/testing/env.mock.ts"
        ),
      },
      {
        find: /^@workspace\/ui\/(.*)$/,
        replacement: `${path.resolve(__dirname, "../ui/src")}/$1`,
      },
      {
        find: "@workspace/logger",
        replacement: path.resolve(__dirname, "../logger/src/index.ts"),
      },
      {
        find: "lucide-react/dynamic",
        replacement: path.resolve(
          __dirname,
          "src/internal/testing/lucide-react-dynamic.mock.tsx"
        ),
      },
      {
        find: "lucide-react",
        replacement: path.resolve(
          __dirname,
          "src/internal/testing/lucide-react.mock.tsx"
        ),
      },
      {
        find: "next/link",
        replacement: path.resolve(
          __dirname,
          "src/internal/testing/next-link.mock.tsx"
        ),
      },
    ],
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.tsx"],
    coverage: {
      reporter: ["text", "lcov", "clover"],
    },
  },
});
