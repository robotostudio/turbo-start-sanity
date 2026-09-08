import {
  type APIRequestContext,
  test as base,
  expect,
  type Locator,
} from "@playwright/test";
import { createClient } from "@sanity/client";
import { DEFAULT_SANITY_API_VERSION } from "@workspace/env/constants";

/**
 * Shared by every spec that drives the Studio's Presentation tool against the
 * site. Importing `test` from here gives a logged-in Studio context, a write
 * client, a run-scoped id prefix, and dataset cleanup around the worker.
 */

export const STUDIO_URL = "http://localhost:3333";

/** How long a live update may take to reach an open tab. */
export const LIVE_TIMEOUT = 10_000;

/** How long a write may take to land in the dataset — the API has been seen taking 18s on a single mutation. */
export const SYNC_TIMEOUT = 30_000;

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
// One Editor-role token is both the Studio session and the write client;
// `SANITY_API_WRITE_TOKEN` already has that role, so a local run needs no setup.
const token =
  process.env.SANITY_E2E_SESSION_TOKEN || process.env.SANITY_API_WRITE_TOKEN;

if (!(projectId && dataset && token)) {
  throw new Error(
    "Presentation e2e needs NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_E2E_SESSION_TOKEN (or SANITY_API_WRITE_TOKEN)"
  );
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion:
    process.env.NEXT_PUBLIC_SANITY_API_VERSION || DEFAULT_SANITY_API_VERSION,
  token,
  useCdn: false,
  perspective: "raw",
});

// Two PRs can run at once against the same dataset, so every id and slug a
// run creates carries its own prefix and cleanup only ever touches that prefix.
// The exception is presentation-singletons.spec.ts, which edits the real
// navbar/footer/settings — those cannot be prefixed, so that file is not safe
// to run concurrently with another run.
export const runId = process.env.GITHUB_RUN_ID
  ? [
      process.env.GITHUB_RUN_ID,
      process.env.GITHUB_RUN_ATTEMPT ?? "1",
      process.env.GITHUB_JOB ?? "0",
    ].join("-")
  : `${Date.now()}`;
export const prefix = `e2e-${runId}-`;

// Documents this run owns: prefixed ids, and any `redirect` the auto-redirect
// Sanity Function created for one of its slugs.
const inPrefix = `(string::startsWith(_id, $prefix) || string::startsWith(_id, "drafts." + $prefix) || _id match ("versions.*." + $prefix + "*") || (_type == "redirect" && (string::startsWith(source.current, "/" + $prefix) || string::startsWith(source.current, "/blog/" + $prefix))))`;
const isStale = `((string::startsWith(_id, "e2e-") || string::startsWith(_id, "drafts.e2e-") || _id match "versions.*.e2e-*" || (_type == "redirect" && (string::startsWith(source.current, "/e2e-") || string::startsWith(source.current, "/blog/e2e-")))) && dateTime(_createdAt) < dateTime(now()) - 3600)`;

/** Delete every document this run created, drafts included. */
export const deleteOwn = () =>
  client.delete({ query: `*[${inPrefix}]`, params: { prefix } });

/**
 * Type into a Studio field and make sure the value stuck. A form pane
 * re-mounts as the document loads, which detaches the input mid-`fill` and
 * silently drops the keystrokes — the autosave then never fires.
 */
export const fillStable = async (field: Locator, value: string) => {
  await expect(field).toBeVisible({ timeout: 90_000 });
  await expect(async () => {
    await field.fill(value);
    await expect(field).toHaveValue(value, { timeout: 1000 });
  }).toPass({ timeout: 30_000 });
};

/**
 * `expect.poll` calls its predicate outside the retry's try/catch, so a
 * rejection ends the poll instead of being retried. Anything that talks to the
 * network goes through here.
 */
export const soft =
  <T>(fn: () => Promise<T>) =>
  async (): Promise<T | null> => {
    try {
      return await fn();
    } catch {
      return null;
    }
  };

/** `() => status` for `expect.poll`; `request` carries no cookies, so this is an anonymous visitor. */
export const status =
  (request: APIRequestContext, path: string) => async () => {
    try {
      return (await request.get(path)).status();
    } catch {
      return 0;
    }
  };

export const test = base.extend<
  Record<never, never>,
  { e2eDataset: undefined }
>({
  // Sanity's own Studio suite logs in this way: a token in localStorage is a
  // session (`getStorageStateForProjectId` in @sanity/test). No cookies, so
  // the `request` fixture built from the same state is still anonymous.
  storageState: {
    cookies: [],
    origins: [
      {
        origin: STUDIO_URL,
        localStorage: [
          {
            name: `__studio_auth_token_${projectId}`,
            value: JSON.stringify({ token, time: new Date().toISOString() }),
          },
        ],
      },
    ],
  },
  e2eDataset: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture signature
    async ({}, use) => {
      // Own prefix (a re-run of the same run id) plus whatever a run that died
      // mid-way left behind more than an hour ago. Concurrent runs keep theirs.
      await client.delete({
        query: `*[${inPrefix} || ${isStale}]`,
        params: { prefix },
      });
      await use(undefined);
      await deleteOwn();
    },
    { scope: "worker", auto: true },
  ],
});

// Every visitor context holds an open SanityLive connection. A test that fails
// before its own `close()` leaks one, and enough of them stop live events
// reaching later files — which looks exactly like a broken cache. The context
// Playwright made for the `page` fixture is first and is left to Playwright.
test.afterEach(async ({ browser, page }) => {
  const own = page.context();
  await Promise.all(
    browser
      .contexts()
      .filter((context) => context !== own)
      .map((context) => context.close())
  );
});

export { expect };
