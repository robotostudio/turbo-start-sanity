import type { Page } from "@playwright/test";

import {
  client,
  deleteRelease,
  expect,
  fillStable,
  prefix,
  type ReleaseRef,
  releaseClient,
  runId,
  STUDIO_URL,
  SYNC_TIMEOUT,
  soft,
  status,
  test,
} from "./presentation-fixtures";

/**
 * A Content Release edited in the Studio reaches the site only
 * through the perspective Presentation hands the web app (the cookie
 * `resolvePerspectiveFromCookies` reads), and publishing the release is what
 * makes it public.
 *
 * Requires the web app's `NEXT_PUBLIC_SANITY_API_VERSION` to be unset or
 * >= 2025-02-19. A release perspective is a *complex* (array) perspective —
 * `["<releaseId>", "drafts"]` — and older versions reject it with
 * "Complex perspectives are not supported for this version", which surfaces as
 * a preview stuck on "Could not connect to the preview" rather than as an
 * error an editor can read.
 */

const pageDoc = {
  id: `${prefix}release-page`,
  slug: `/${prefix}release-page`,
  title: `E2E release page ${runId}`,
  heading: `E2E hero ${runId}`,
  releaseHeading: `E2E release hero ${runId}`,
};
// Per attempt: a retry that follows an incomplete cleanup would otherwise
// resolve the leftover release by title and assert on its state.
let releaseTitle = `e2e-${runId}-0`;
// The Studio picks the release id, so it is looked up by title once created.
let releaseId: string;

const hero = (title: string) => ({ _type: "hero", _key: "hero", title });

const findRelease = () =>
  releaseClient.fetch<ReleaseRef | null>(
    "releases::all()[metadata.title == $title][0]{name, state}",
    { title: releaseTitle }
  );

type Stampable = Pick<Page, "evaluate"> | null;
// A live update must land without a navigation; a reload would wipe the stamp.
const stamp = (target: Stampable) =>
  target?.evaluate(() => {
    (window as { __e2e?: boolean }).__e2e = true;
  });
const expectStamped = async (target: Stampable) =>
  expect(
    await target?.evaluate(() => (window as { __e2e?: boolean }).__e2e),
    "page navigated instead of updating live"
  ).toBe(true);

// See the file header: below 2025-02-19 the app cannot serve a release
// perspective, so this asserts nothing and says why.
const appApiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
const SUPPORTS_RELEASES = !appApiVersion || appApiVersion >= "2025-02-19";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  releaseTitle = `e2e-${runId}-${test.info().retry}`;
  await client.createOrReplace({
    _id: pageDoc.id,
    _type: "page",
    title: pageDoc.title,
    slug: { _type: "slug", current: pageDoc.slug },
    pageBuilder: [hero(pageDoc.heading)],
  });
});

// The worker teardown only knows prefixed document ids; a release the run
// left behind (a failure before the cleanup test) is removed here; a run that
// never reaches this hook is covered by the stale sweep in the fixtures.
test.afterAll(async () => {
  const releases = await releaseClient.fetch<ReleaseRef[]>(
    "releases::all()[string::startsWith(metadata.title, $prefix)]{name, state}",
    { prefix: `e2e-${runId}-` }
  );
  // Settled, not a loop: one release that refuses to go must not take the
  // others' deletes with it.
  const results = await Promise.allSettled(releases.map(deleteRelease));
  const failed = results.flatMap((result) =>
    result.status === "rejected" ? [String(result.reason)] : []
  );
  expect(failed, "release cleanup failed — delete these in the Studio").toEqual(
    []
  );
});

test("release: created in the Studio, page version added to it", async ({
  page: studio,
}) => {
  await studio.goto(`${STUDIO_URL}/releases`);
  const create = studio.getByRole("button", {
    name: "New release",
    exact: true,
  });
  await expect(create).toBeVisible({ timeout: 90_000 });
  // The button swallows a click made before the tool finishes hydrating, and
  // the dialog then re-mounts its form once as it opens — so both the opening
  // and the typing are retried until they take.
  const titleField = studio.getByTestId("release-form-title");
  await expect(async () => {
    await create.click();
    await expect(titleField).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 60_000 });
  await fillStable(titleField, releaseTitle);
  const submit = studio.getByTestId("submit-release-button");
  await expect(async () => {
    await submit.click({ timeout: 5000 });
    await expect(submit).toBeHidden({ timeout: 5000 });
  }).toPass({ timeout: 60_000 });

  await expect.poll(soft(findRelease), { timeout: SYNC_TIMEOUT }).toBeTruthy();
  const release = await findRelease();
  releaseId = release?.name ?? "";
  expect(releaseId).not.toBe("");
  expect(release?.state).toBe("active");

  // The change itself goes in through the client: the published page with a
  // new hero heading, as the release's version of it.
  await releaseClient.createVersion({
    document: {
      _type: "page",
      title: pageDoc.title,
      slug: { _type: "slug", current: pageDoc.slug },
      pageBuilder: [hero(pageDoc.releaseHeading)],
    },
    publishedId: pageDoc.id,
    releaseId,
  });
  await expect
    .poll(
      soft(() =>
        releaseClient.getDocument(`versions.${releaseId}.${pageDoc.id}`)
      ),
      {
        timeout: SYNC_TIMEOUT,
      }
    )
    .toBeTruthy();
});

test("Presentation: the navbar perspective menu switches the preview between release and published", async ({
  page: studio,
}) => {
  test.skip(
    !SUPPORTS_RELEASES,
    `the web app is pinned to NEXT_PUBLIC_SANITY_API_VERSION=${appApiVersion}, which rejects a release perspective; unset it or use >= 2025-02-19`
  );
  await studio.goto(
    `${STUDIO_URL}/presentation/page/${pageDoc.id}?preview=${pageDoc.slug}`
  );
  const preview = studio.frameLocator("iframe");
  // Presentation text carries stega characters, so no `exact` in the iframe.
  await expect(
    preview.getByRole("heading", { level: 1, name: pageDoc.heading })
  ).toBeVisible({ timeout: 90_000 });

  // Pin the release: Presentation posts the perspective to the iframe, the
  // web app writes it to its cookie and refreshes.
  await studio.getByTestId("global-perspective-menu-button").click();
  const releaseOption = studio.getByTestId(`release-${releaseId}`);
  await expect(releaseOption).toBeVisible({ timeout: SYNC_TIMEOUT });
  await releaseOption.click();
  await expect(
    preview.getByRole("heading", { level: 1, name: pageDoc.releaseHeading })
  ).toBeVisible({ timeout: SYNC_TIMEOUT });
  await expect(
    preview.getByRole("heading", { level: 1, name: pageDoc.heading })
  ).toBeHidden();

  // Back to published: the release version disappears from the preview.
  await studio.getByTestId("global-perspective-menu-button").click();
  await studio.getByTestId("release-published").click();
  await expect(
    preview.getByRole("heading", { level: 1, name: pageDoc.heading })
  ).toBeVisible({ timeout: SYNC_TIMEOUT });
  await expect(
    preview.getByRole("heading", { level: 1, name: pageDoc.releaseHeading })
  ).toBeHidden();
});

test("public: an anonymous visitor and the Markdown route only see the published heading", async ({
  request,
}) => {
  for (const path of [pageDoc.slug, `${pageDoc.slug}.md`]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const body = await response.text();
    expect(body, path).toContain(pageDoc.heading);
    expect(body, path).not.toContain(pageDoc.releaseHeading);
  }
});

test("publish release: fresh visitors see the new heading, an open tab updates live", async ({
  browser,
  request,
}) => {
  // An open tab keeps SanityLive listening, which is what invalidates the
  // cached public route once the release publishes.
  const visitor = await browser.newContext();
  const publicTab = await visitor.newPage();
  await publicTab.goto(pageDoc.slug);
  await expect(
    publicTab.getByRole("heading", {
      level: 1,
      name: pageDoc.heading,
      exact: true,
    })
  ).toBeVisible();
  await stamp(publicTab);

  await releaseClient.releases.publish({ releaseId });
  await expect
    .poll(
      soft(async () => (await findRelease())?.state),
      { timeout: SYNC_TIMEOUT }
    )
    .toBe("published");

  await expect(
    publicTab.getByRole("heading", {
      level: 1,
      name: pageDoc.releaseHeading,
      exact: true,
    })
  ).toBeVisible({ timeout: SYNC_TIMEOUT });
  await expectStamped(publicTab);

  const fresh = await (await browser.newContext()).newPage();
  await fresh.goto(pageDoc.slug);
  await expect(
    fresh.getByRole("heading", {
      level: 1,
      name: pageDoc.releaseHeading,
      exact: true,
    })
  ).toBeVisible();
  await fresh.context().close();

  await expect
    .poll(async () => (await request.get(`${pageDoc.slug}.md`)).text(), {
      timeout: SYNC_TIMEOUT,
    })
    .toContain(pageDoc.releaseHeading);
  await visitor.close();
});

test("cleanup: the release is deleted and its document is gone", async ({
  request,
}) => {
  // A published release can no longer be archived (the API and the Studio
  // menu both gate archive on `active`); delete takes it straight away.
  await releaseClient.releases.delete({ releaseId });
  // `releases::all()` on the Releases-capable client, not a `system.release`
  // document query on the app's version: that query returns [] both when the
  // release is gone and when the version cannot see release documents at all.
  await expect.poll(soft(findRelease), { timeout: SYNC_TIMEOUT }).toBeNull();
  // The published page outlives the release.
  expect(await status(request, pageDoc.slug)()).toBe(200);
});
