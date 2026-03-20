import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(import.meta.dirname, ".env.local"),
  quiet: true,
});

function resolveBaseURL(): string {
  const deployedURL = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (!process.env.CI || !deployedURL) return "http://localhost:3000";
  if (deployedURL.startsWith("http")) return deployedURL;
  return `https://${deployedURL}`;
}

const baseURL = resolveBaseURL();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    navigationTimeout: 30_000,
    ...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET && {
      extraHTTPHeaders: {
        "x-vercel-protection-bypass":
          process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
        "x-vercel-set-bypass-cookie": "samesitenone",
      },
    }),
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  ...(!process.env.CI && {
    webServer: {
      command: "pnpm dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  }),
});
