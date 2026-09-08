import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(import.meta.dirname, ".env.local"),
  quiet: true,
});

const isCI = !!process.env.CI;

function resolveBaseURL(): string {
  const deployedURL = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (!isCI || !deployedURL) return "http://localhost:3000";
  if (deployedURL.startsWith("http")) return deployedURL;
  return `https://${deployedURL}`;
}

/**
 * Studio → website loop. Separate from `playwright.config.ts`: this suite needs
 * a Studio beside the site, writes to the shared dataset (hence one worker) and
 * runs a production `next start` — under `next dev`, `DRAFTS_WITHOUT_SESSION`
 * serves drafts to anonymous requests and every privacy assertion goes vacuous.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /presentation.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  // One retry: the failures this absorbs are live-propagation timing on a
  // shared dataset, not logic. Serial mode re-runs the whole file, and each
  // file's `beforeAll` rebuilds the documents it owns.
  retries: 1,
  // The first Studio load compiles the Presentation tool on demand (`sanity
  // dev` is Vite), which alone can take longer than the 30s default.
  timeout: 120_000,
  forbidOnly: isCI,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: resolveBaseURL(),
    // No trace in CI: it records every request header, and the Studio sends
    // the Editor token on each API call — the report is uploaded as an
    // artifact of a public repo.
    trace: isCI ? "off" : "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 30_000,
    // Covers `request` and the pages this suite drives, but NOT the
    // Presentation iframe — that would need a bypass cookie on the context.
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
  webServer: [
    {
      // CI serves the production build made in the workflow, with
      // SANITY_STUDIO_PRESENTATION_URL pointing at the PR's preview; `sanity
      // dev` would hardcode Presentation to localhost:3000.
      command: isCI ? "pnpm --filter studio start" : "pnpm --filter studio dev",
      url: "http://localhost:3333",
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
    ...(isCI
      ? []
      : [
          {
            // Never reuse: a `next dev` already on 3000 would serve drafts to
            // the anonymous checks. Playwright fails fast on the busy port.
            command: "pnpm --filter web build && pnpm --filter web start",
            url: "http://localhost:3000",
            reuseExistingServer: false,
            timeout: 600_000,
          },
        ]),
  ],
});
