import {
  type APIRequestContext,
  test as base,
  expect,
  type Locator,
} from "@playwright/test";
import { createClient } from "@sanity/client";
import { DEFAULT_SANITY_API_VERSION } from "@workspace/env/constants";
import { handleErrors } from "@/utils";

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
// The worker index, not just the run: a retry runs in a fresh worker whose
// fixture already deleted the previous worker's documents, and reopening an id
// Sanity now treats as deleted gives a read-only form that `fill` can never
// satisfy.
export const prefix = `e2e-${runId}-w${process.env.TEST_WORKER_INDEX ?? 0}-`;

/**
 * Where presentation-singletons.spec.ts parks its rescue copy of navbar/footer/
 * settings, so a run that dies mid-edit can be undone by the next one. Exempt
 * from the stale sweep below — sweeping it is deleting the only way back.
 */
export const SINGLETON_SNAPSHOT_ID = "e2e-singleton-snapshot";

// Documents this run owns: prefixed ids, and any `redirect` the auto-redirect
// Sanity Function created for one of its slugs.
const inPrefix = `(string::startsWith(_id, $prefix) || string::startsWith(_id, "drafts." + $prefix) || _id match ("versions.*." + $prefix + "*") || (_type == "redirect" && (string::startsWith(source.current, "/" + $prefix) || string::startsWith(source.current, "/blog/" + $prefix))))`;
const isStale = `(_id != "${SINGLETON_SNAPSHOT_ID}" && (string::startsWith(_id, "e2e-") || string::startsWith(_id, "drafts.e2e-") || _id match "versions.*.e2e-*" || (_type == "redirect" && (string::startsWith(source.current, "/e2e-") || string::startsWith(source.current, "/blog/e2e-")))) && dateTime(_createdAt) < dateTime(now()) - 3600)`;

/** Delete every document this run created, drafts included. */
export const deleteOwn = () =>
  client.delete({ query: `*[${inPrefix}]`, params: { prefix } });

// A release is a `_.releases.*` system document — invisible to `*[...]`, so the
// sweep above cannot reach one, and a workspace holds a limited number. The
// app's pinned API version predates the Releases actions, hence its own client.
export const releaseClient = client.withConfig({ apiVersion: "vX" });

export type ReleaseRef = { name: string; state: string };

/**
 * `delete` rejects an active release and `archive` rejects an inactive one, so
 * the archive is best effort and the delete is the failure worth reporting.
 */
export const deleteRelease = async ({ name, state }: ReleaseRef) => {
  if (state === "active") {
    await releaseClient.releases
      .archive({ releaseId: name })
      .catch(() => undefined);
  }
  await releaseClient.releases.delete({ releaseId: name });
};

// Past any live run, short of the workspace release limit.
const RELEASE_MAX_AGE_SECONDS = 6 * 3600;

/**
 * Covers a run killed before its own `afterAll` ran. Best effort: a failing
 * Releases API must not break specs that never touch one, and the next run
 * sweeps again.
 */
const sweepStaleReleases = async () => {
  try {
    const stale = await releaseClient.fetch<ReleaseRef[]>(
      `releases::all()[string::startsWith(metadata.title, "e2e-") && dateTime(_createdAt) < dateTime(now()) - ${RELEASE_MAX_AGE_SECONDS}]{name, state}`
    );
    await Promise.allSettled(stale.map((release) => deleteRelease(release)));
  } catch {
    return;
  }
};

/**
 * Type into a Studio field and make sure the value stuck. A form pane
 * re-mounts as the document loads, which detaches the input mid-`fill` and
 * silently drops the keystrokes — the autosave then never fires.
 */
export const fillStable = async (field: Locator, value: string) => {
  await expect(field).toBeVisible({ timeout: 90_000 });
  await expect(async () => {
    // Bounded: an uneditable field would otherwise hold the default forever and
    // `toPass` would report a bare timeout with no call log.
    await field.fill(value, { timeout: 5_000 });
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
    // Branch on the error slot, never on the value: `client.getDocument`
    // resolves `undefined` for a document that is gone, and `?? null` would
    // turn that success into the failure sentinel.
    const [value, error] = await handleErrors(fn());
    return error === undefined ? (value as T) : null;
  };

/**
 * `() => body` for `expect.poll`, guarded on 200 — an error body contains none
 * of the strings a `not.toContain` looks for, so it satisfies them all.
 */
export const html = (request: APIRequestContext, path: string) =>
  soft(async () => {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    return response.text();
  });

/** `() => status` for `expect.poll`; `request` carries no cookies, so this is an anonymous visitor. */
export const status =
  (request: APIRequestContext, path: string) => async () => {
    const [response] = await handleErrors(request.get(path));
    return response?.status() ?? 0;
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
      // All three, not merely one: presentation-singletons.spec.ts needs every
      // singleton published, and a half-seeded dataset otherwise fails deep in
      // that spec on whichever one is missing.
      const seeded = await client.fetch<number>(
        `count(*[_id in ["navbar", "footer", "settings"]])`
      );
      if (seeded < 3) {
        throw new Error(
          `Sanity dataset "${dataset}" has no published navbar/footer/settings. Seed it from your content dataset: cd apps/studio && npx sanity dataset copy <source> ${dataset}`
        );
      }
      // Own prefix (a re-run of the same run id) plus whatever a run that died
      // mid-way left behind more than an hour ago. Concurrent runs keep theirs.
      // Releases first: a stale release still owns its `versions.*` documents,
      // and the document sweep below cannot delete those while it is active.
      await sweepStaleReleases();
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
