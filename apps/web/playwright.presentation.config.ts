import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(import.meta.dirname, ".env.local"),
  quiet: true,
});

const isCI = !!process.env.CI;

// Never the live site's dataset: this suite publishes into the real
// navbar/footer/settings. Set before the webServers spawn so they all agree.
// `||`, not `??`: .env.example ships the key blank, and dotenv reads that as
// an empty string.
process.env.NEXT_PUBLIC_SANITY_DATASET =
  process.env.SANITY_E2E_DATASET || "e2e";
process.env.SANITY_STUDIO_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
// Without a secret the revalidate route fails closed and 401s everything, so
// both "rejects a bad secret" tests would pass without exercising the compare.
process.env.SANITY_REVALIDATE_SECRET ||= `e2e-${Date.now()}`;

// Complex (array) perspectives need >= 2025-02-19; a lower pin silently skips
// the Releases perspective test. Unset falls back to today's UTC date.
if (
  (process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "").replace(/^v/, "") <
  "2025-02-19"
) {
  process.env.NEXT_PUBLIC_SANITY_API_VERSION = "";
}

if (/^prod/i.test(process.env.NEXT_PUBLIC_SANITY_DATASET)) {
  throw new Error(
    `This suite publishes into the real navbar/footer/settings — refusing to run against "${process.env.NEXT_PUBLIC_SANITY_DATASET}"`
  );
}

/**
 * Studio → website loop, kept apart from `playwright.config.ts`.
 *
 * `next start`, never `next dev`: `DRAFTS_WITHOUT_SESSION` serves drafts to
 * anonymous requests in dev, which makes every privacy assertion vacuous.
 *
 * Serves the site here, never a deployed preview: Vercel's edge cache answers a
 * public route up to 300s stale and no request header gets past it, so the
 * "anonymous visitor sees the publish" assertions would race a CDN.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /presentation.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  // Absorbs live-propagation timing, not logic. Serial mode re-runs the whole
  // file; each `beforeAll` rebuilds the documents it owns.
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
    baseURL: "http://localhost:3000",
    // No trace in CI: it records every request header, and the Studio sends
    // the Editor token on each API call — the report is uploaded as an
    // artifact of a public repo.
    trace: isCI ? "off" : "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      // CI serves the `dist` the workflow builds; locally, Vite dev.
      command: isCI ? "pnpm --filter studio start" : "pnpm --filter studio dev",
      url: "http://localhost:3333",
      // Never reuse: a Studio already on 3333 takes its dataset from
      // apps/studio/.env, so every Publish would land in that dataset while the
      // site and the write client use the pinned one.
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      // Next adds a `drain` listener per concurrent write to a response's Gzip
      // stream, and this suite holds many tabs open, so Node's 10-listener
      // warning fires on hundreds of separate streams. Every one reports 11,
      // never more — nothing accumulates. Suppressed for this server only.
      env: {
        NODE_OPTIONS:
          `${process.env.NODE_OPTIONS ?? ""} --disable-warning=MaxListenersExceededWarning`.trim(),
      },
      // Never reuse: a `next dev` already on 3000 would serve drafts to the
      // anonymous checks. Playwright fails fast on the busy port.
      command: "pnpm --filter web build && pnpm --filter web start",
      url: "http://localhost:3000",
      reuseExistingServer: false,
      timeout: 600_000,
    },
  ],
});
