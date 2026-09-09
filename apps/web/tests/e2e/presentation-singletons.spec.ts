import type { BrowserContext, FrameLocator, Page } from "@playwright/test";

import {
  client,
  expect,
  expectStamped,
  fillStable,
  html,
  LIVE_TIMEOUT,
  openListening,
  prefix,
  runId,
  SINGLETON_SNAPSHOT_ID,
  STUDIO_URL,
  SYNC_TIMEOUT,
  settle,
  soft,
  stamp,
  test,
} from "./presentation-fixtures";

/**
 * navbar, footer and settings are singletons rendered by the root layout, so an
 * edit reaches every route through the layout's cache tags, not a page's. They
 * cannot carry a run prefix and cannot be deleted, so the suite snapshots them
 * (draft included) and writes the snapshot back in `afterAll` — otherwise the
 * next run starts on the last one's content.
 */

// Presentation gives the preview 75% of the window and the desktop nav is
// `hidden lg:flex`, so at the default 1280px the 960px iframe has no nav links.
test.use({ viewport: { width: 1920, height: 1080 } });
test.describe.configure({ mode: "serial" });

const SINGLETONS = ["navbar", "footer", "settings"] as const;
type SingletonId = (typeof SINGLETONS)[number];

// The published page the nav link points at; doubles as the "existing page".
// Its own id, not `${prefix}page`: presentation.spec.ts owns that one and
// sorts after this file, so sharing it would leave a published page where
// that spec expects a brand-new draft.
const pageDoc = {
  id: `${prefix}nav-target`,
  slug: `/${prefix}nav-target`,
  title: `E2E nav target ${runId}`,
};
const ROUTES = ["/", "/blog", pageDoc.slug];

// `runId` is digits, hyphens and the job name — regex-safe unescaped below.
const linkName = `E2E ${runId}`;
const footerSubtitle = `E2E footer ${runId}`;
const siteTitle = `E2E site ${runId}`;

type SanityDoc = Record<string, unknown> & { _id: string; _type: string };
type Snapshot = [string, SanityDoc | null][];

// Every singleton as found before the run, published and draft; a draft that
// did not exist is `null` and gets deleted on restore rather than written.
const before = new Map<string, SanityDoc | null>();

const strip = ({ _rev, _createdAt, _updatedAt, ...doc }: SanityDoc) => doc;

/**
 * The snapshot lives in the dataset, not `tmpdir()`: a cancelled CI job takes
 * its runner with it, and a local retry gets a fresh `runId` and so a filename
 * it can never find — either way the E2E navbar stays published with nothing
 * to restore it from. Any later run finds the document and puts the singletons
 * back. Stored as a JSON string so the navbar's `_ref`s stay inert text rather
 * than real references pinning pages this suite deletes.
 */
const writeSnapshot = () =>
  client.createOrReplace({
    _id: SINGLETON_SNAPSHOT_ID,
    _type: "e2eSingletonSnapshot",
    json: JSON.stringify([...before]),
  });

/** Past any live run; older than this a snapshot is stale, not a rescue. */
const SNAPSHOT_MAX_AGE_SECONDS = 6 * 3600;

/** Text only this suite writes into the singletons. */
const E2E_CONTENT = /E2E (\d{6,}|footer|site)/;

const restore = (entries: Snapshot) => {
  let tx = client.transaction();
  for (const [id, doc] of entries) {
    tx = doc ? tx.createOrReplace(strip(doc)) : tx.delete(id);
  }
  return tx.commit();
};

test.beforeAll(async () => {
  const ids = SINGLETONS.flatMap((id) => [id, `drafts.${id}`]);
  // A snapshot that outlived its run means that run died before restoring. It
  // has no age bound, so replay it only over pollution this suite recognises as
  // its own; over clean singletons it is obsolete — drop it, restore nothing.
  // Age-bounded: replaying a months-old snapshot would overwrite every editor
  // change made since. Past that it is not a rescue, just stale data.
  const rescue = await client.fetch<{ json: string } | null>(
    `*[_id == $id && dateTime(_updatedAt) > dateTime(now()) - ${SNAPSHOT_MAX_AGE_SECONDS}][0]{json}`,
    { id: SINGLETON_SNAPSHOT_ID }
  );
  if (rescue) {
    const live: SanityDoc[] = await client.fetch("*[_id in $ids]", { ids });
    if (E2E_CONTENT.test(JSON.stringify(live))) {
      await restore(JSON.parse(rescue.json) as Snapshot);
      // Only once the restore landed: dropping it on the other branch destroys
      // the one copy that can undo a leak this run failed to recognise.
      await client.delete(SINGLETON_SNAPSHOT_ID);
    }
  }

  const docs: SanityDoc[] = await client.fetch("*[_id in $ids]", { ids });
  // Never absorb a previous run's leftovers as the baseline: snapshotting
  // polluted singletons would write E2E content back as the original and make
  // it permanent. Fail before the snapshot document exists.
  expect(
    JSON.stringify(docs),
    "singletons still carry E2E content from an earlier run — restore them before running this spec"
  ).not.toMatch(E2E_CONTENT);
  for (const id of ids) {
    before.set(id, docs.find((doc) => doc._id === id) ?? null);
  }
  for (const id of SINGLETONS) {
    expect(before.get(id), `${id} is not published`).toBeTruthy();
  }
  await writeSnapshot();

  // A retry's fresh worker re-runs the dataset sweep, which deletes this page,
  // and the nav link would then resolve to no href.
  await client.createOrReplace({
    _id: pageDoc.id,
    _type: "page",
    title: pageDoc.title,
    slug: { _type: "slug", current: pageDoc.slug },
  });
});

test.afterAll(async ({ browser }) => {
  if (before.size === 0) {
    return;
  }
  const visitor = await browser.newContext();
  try {
    // Tabs first: a cached route is only flushed while a SanityLive tab is
    // listening, so restoring before they open leaves this run's navbar served
    // to real editors. Failure-tolerant: a site that is down is exactly the run
    // whose singletons must still be restored.
    const opened = await Promise.all(
      ["/", "/blog"].map((route) =>
        visit(visitor, route).then(
          (tab) => tab,
          () => null
        )
      )
    );
    await restore([...before]);
    await client.delete(SINGLETON_SNAPSHOT_ID);

    for (const tab of opened.filter((tab) => tab !== null)) {
      await expect
        .poll(html(tab.request, new URL(tab.url()).pathname), {
          timeout: SYNC_TIMEOUT,
        })
        .not.toContain(runId);
    }
  } finally {
    await visitor.close();
  }
});

const preview = (studio: Page) => studio.frameLocator("iframe");
const mainNav = (scope: Page | FrameLocator) =>
  scope.getByRole("navigation", { name: "Main" });

// A live update must land without a navigation; a reload would wipe the stamp.

// A public route's cache is only invalidated while a SanityLive tab is open
// on it, so every route under test gets a visitor before the publish.
const visit = async (context: BrowserContext, path: string) => {
  const tab = await openListening(context, path);
  await stamp(tab);
  return tab;
};

/**
 * The Studio form's value is browser state — `fillStable` asserts the input,
 * not a committed mutation. The preview and Publish both read the dataset, so
 * assert the edit landed there first; otherwise both act on the pre-edit draft.
 */
const draftHas = (id: SingletonId, value: string) =>
  expect
    .poll(
      soft(
        async () =>
          JSON.stringify(await client.getDocument(`drafts.${id}`)) ?? ""
      ),
      { timeout: SYNC_TIMEOUT }
    )
    .toContain(value);

/** Publish through the Studio and wait for the dataset to carry `value`. */
const publish = async (studio: Page, id: SingletonId, value: string) => {
  // Publishing before the draft lands ships the pre-edit document, and the
  // poll below then times out on content that was never published.
  await draftHas(id, value);
  await studio.getByTestId("action-publish").click();
  await expect
    .poll(
      soft(async () => JSON.stringify(await client.getDocument(id))),
      {
        timeout: SYNC_TIMEOUT,
      }
    )
    .toContain(value);
  await settle(id, value);
};

test("navbar: draft link shows in Presentation on every route, not publicly", async ({
  page: studio,
  request,
}) => {
  // Adding an array item through the Studio form is fiddly; the draft is
  // written the way the Studio would (published document plus the change)
  // and the Studio is used for Publish.
  const published = before.get("navbar") as SanityDoc;
  const columns = (published.columns as unknown[] | undefined) ?? [];
  await client.createOrReplace({
    ...strip(published),
    _id: "drafts.navbar",
    columns: [
      ...columns,
      {
        _key: `${prefix}link`,
        _type: "navbarLink",
        name: linkName,
        url: {
          _type: "customUrl",
          type: "internal",
          openInNewTab: false,
          href: "#",
          internal: { _type: "reference", _ref: pageDoc.id },
        },
      },
    ],
  });

  await studio.goto(`${STUDIO_URL}/presentation/navbar/navbar?preview=/`);
  const frame = preview(studio);
  // Presentation text carries stega characters, so no `exact` in the iframe.
  const link = mainNav(frame).getByRole("link", { name: linkName });
  await expect(link).toBeVisible({ timeout: 90_000 });

  // The ticket says "click a nav item". In Presentation that is not a
  // navigation: with the Edit overlay on, a click selects the element for
  // editing, and with it off Presentation still resets the iframe to its
  // `preview` param. Driving the preview param is how Presentation actually
  // changes route, so the draft nav is asserted on each route that way — and
  // the link's `href` is checked against the real page once it is published
  // (see the publish test), which is the part a click would have proven.
  for (const route of [pageDoc.slug, "/blog"]) {
    await studio.goto(
      `${STUDIO_URL}/presentation/navbar/navbar?preview=${route}`
    );
    await expect(link).toBeVisible({ timeout: SYNC_TIMEOUT });
  }

  expect(await html(request, "/")()).not.toContain(linkName);
  expect(await html(request, "/blog")()).not.toContain(linkName);
});

test("navbar: publish puts the link on every route", async ({
  page: studio,
  browser,
  request,
}) => {
  const visitor = await browser.newContext();
  const tabs = await Promise.all(ROUTES.map((path) => visit(visitor, path)));

  await studio.goto(`${STUDIO_URL}/presentation/navbar/navbar?preview=/`);
  await expect(
    mainNav(preview(studio)).getByRole("link", { name: linkName })
  ).toBeVisible({ timeout: LIVE_TIMEOUT });
  await publish(studio, "navbar", linkName);

  // What the ticket asks for: a fresh anonymous request to each route carries
  // the link. The open tabs above are what drive the invalidation (a cached
  // route is only flushed while a SanityLive tab is listening on it), so this
  // is the assertion that proves the layout's cache tags did their job.
  for (const path of ROUTES) {
    await expect
      .poll(html(request, path), { timeout: SYNC_TIMEOUT })
      .toContain(linkName);
  }

  // And the already-open tabs repaint without a navigation. Checked after the
  // HTTP assertion because the client refresh trails the cache flush.
  for (const tab of tabs) {
    const link = mainNav(tab).getByRole("link", {
      name: linkName,
      exact: true,
    });
    await expect(link).toBeVisible({ timeout: SYNC_TIMEOUT });
    await expect(link).toHaveAttribute("href", pageDoc.slug);
    await expectStamped(tab);
  }
  await visitor.close();
});

test("navbar: /index.md is served, without the link", async ({ request }) => {
  // The Markdown route serializes the page document only (`pageToMarkdown`), so
  // layout singletons never reach it. Asserted rather than `test.fail`, which
  // would also accept a 404 or a 500.
  const body = await html(request, "/index.md")();
  expect(body, "/index.md is not served").toBeTruthy();
  expect(body).not.toContain(`[${linkName}](`);
});

test("footer: draft subtitle shows in Presentation only, publish puts it on every route", async ({
  page: studio,
  browser,
  request,
}) => {
  const visitor = await browser.newContext();
  const tabs = await Promise.all(ROUTES.map((path) => visit(visitor, path)));

  await studio.goto(`${STUDIO_URL}/presentation/footer/footer?preview=/`);
  const subtitle = studio.getByTestId("field-subtitle").getByRole("textbox");
  await expect(subtitle).toBeVisible({ timeout: LIVE_TIMEOUT });
  await fillStable(subtitle, footerSubtitle);
  await draftHas("footer", footerSubtitle);
  await expect(
    preview(studio).getByRole("contentinfo").getByText(footerSubtitle)
  ).toBeVisible({ timeout: LIVE_TIMEOUT });
  expect(await html(request, "/")()).not.toContain(footerSubtitle);

  await publish(studio, "footer", footerSubtitle);
  for (const tab of tabs) {
    await expect(
      tab.getByRole("contentinfo").getByText(footerSubtitle, { exact: true })
    ).toBeVisible({ timeout: LIVE_TIMEOUT });
    await expectStamped(tab);
  }
  for (const path of ROUTES) {
    expect(await html(request, path)()).toContain(footerSubtitle);
  }
  await visitor.close();
});

test("settings: site title reaches <title> on / after publish", async ({
  page: studio,
  browser,
  request,
}) => {
  const visitor = await browser.newContext();
  const home = await visit(visitor, "/");

  await studio.goto(`${STUDIO_URL}/presentation/settings/settings?preview=/`);
  const title = studio.getByTestId("field-siteTitle").getByRole("textbox");
  await expect(title).toBeVisible({ timeout: LIVE_TIMEOUT });
  await fillStable(title, siteTitle);
  await draftHas("settings", siteTitle);
  // Metadata is fetched without stega, so the draft title reads clean.
  const frame = studio.frame({ url: (url) => url.pathname === "/" });
  expect(frame, "preview iframe is not on /").not.toBeNull();
  await expect
    .poll(
      soft(() => frame?.title() ?? Promise.resolve("")),
      {
        timeout: LIVE_TIMEOUT,
      }
    )
    .toContain(siteTitle);
  expect(await html(request, "/")()).not.toContain(siteTitle);

  await publish(studio, "settings", siteTitle);
  await expect(home).toHaveTitle(new RegExp(siteTitle), {
    timeout: LIVE_TIMEOUT,
  });
  await expectStamped(home);
  expect(await html(request, "/")()).toMatch(
    new RegExp(`<title>[^<]*${siteTitle}`)
  );
  await visitor.close();
});
