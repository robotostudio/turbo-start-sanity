import type { Browser } from "@playwright/test";

import {
  client,
  deleteOwn,
  expect,
  fillStable,
  LIVE_TIMEOUT,
  prefix,
  runId,
  STUDIO_URL,
  SYNC_TIMEOUT,
  soft,
  status,
  test,
} from "./presentation-fixtures";

/**
 * Nested pages: slug rename, unpublish, and the sitemap. Self contained;
 * shares nothing with presentation.spec.ts but the fixtures.
 */

const parent = {
  id: `${prefix}parent`,
  slug: `/${prefix}parent`,
  title: `E2E parent ${runId}`,
};
const child = {
  id: `${prefix}child`,
  slug: `/${prefix}parent/child`,
  renamed: `/${prefix}parent/child-2`,
  title: `E2E child ${runId}`,
};
const redirectSource = `/${prefix}old-path`;

const slugInput = "e.g., /about-us or /blog/my-post";
/** The parent slug is a prefix of the child's, so match the closing tag too. */
const loc = (slug: string) => `${slug}</loc>`;

// A public route's cache is only invalidated while a tab with SanityLive is
// open on it — and SanityLive forwards every event's tags, sitemap included.
// Open visitors on the affected routes before each write, close them after.
const visit = async (browser: Browser, paths: string[]) => {
  const visitor = await browser.newContext();
  for (const path of paths) {
    const tab = await visitor.newPage();
    // Wait for <SanityLive> to open its EventSource: `goto` resolves on load,
    // and a publish that lands before the subscription exists never reaches
    // this tab.
    const live = tab
      .waitForRequest(
        (request) => request.url().includes("/data/live/events/"),
        { timeout: 15_000 }
      )
      .catch(() => null);
    await tab.goto(path);
    await live;
  }
  return visitor;
};

const draftSlug = (id: string) =>
  client.fetch("*[_id == $id][0].slug.current", { id: `drafts.${id}` });

test.describe.configure({ mode: "serial" });

test("nested: parent and template-made child publish and enter the sitemap", async ({
  page: studio,
  browser,
  request,
}) => {
  const sitemap = soft(async () => (await request.get("/sitemap.xml")).text());
  const preview = studio.frameLocator("iframe");

  await studio.goto(
    `${STUDIO_URL}/presentation/page/${parent.id}?preview=${parent.slug}`
  );
  const parentTitle = studio.getByTestId("field-title").getByRole("textbox");
  await fillStable(parentTitle, parent.title);
  await fillStable(studio.getByPlaceholder(slugInput), parent.slug);
  await expect
    .poll(
      soft(() => draftSlug(parent.id)),
      { timeout: SYNC_TIMEOUT }
    )
    .toBe(parent.slug);
  let visitor = await visit(browser, [parent.slug]);
  await studio.getByTestId("action-publish").click();
  await expect
    .poll(
      soft(() => client.getDocument(parent.id)),
      { timeout: SYNC_TIMEOUT }
    )
    .toBeTruthy();
  await expect
    .poll(status(request, parent.slug), { timeout: SYNC_TIMEOUT })
    .toBe(200);
  await visitor.close();

  // Child: the same Presentation form as the parent, with the nested slug.
  // The `nested-page-template` prefill is not exercised — the Studio router's
  // create-intent encoding for template params could not be pinned down, and
  // what this test protects is the nested slug, not the form's initial value.
  await studio.goto(
    `${STUDIO_URL}/presentation/page/${child.id}?preview=${child.slug}`
  );
  await fillStable(
    studio.getByTestId("field-title").getByRole("textbox"),
    child.title
  );
  await fillStable(studio.getByPlaceholder(slugInput), child.slug);
  await expect
    .poll(
      soft(() => draftSlug(child.id)),
      { timeout: SYNC_TIMEOUT }
    )
    .toBe(child.slug);
  // The preview 404'd before the draft existed, so one hard reload — and
  // `page.frame()` is a snapshot with no auto-wait, hence the poll.
  const onChild = () =>
    studio.frame({ url: (url) => url.pathname === child.slug });
  await expect
    .poll(() => onChild() !== null, { timeout: SYNC_TIMEOUT })
    .toBe(true);
  // `evaluate` can reject when the navigation destroys its context.
  await onChild()
    ?.evaluate(() => location.reload())
    .catch(() => undefined);
  await expect(
    preview.getByRole("heading", { level: 1, name: child.title })
  ).toBeVisible({ timeout: LIVE_TIMEOUT });

  visitor = await visit(browser, [parent.slug, child.slug]);
  await studio.getByTestId("action-publish").click();
  await expect
    .poll(
      soft(() => client.getDocument(child.id)),
      { timeout: SYNC_TIMEOUT }
    )
    .toBeTruthy();
  await expect
    .poll(status(request, child.slug), { timeout: SYNC_TIMEOUT })
    .toBe(200);
  await expect
    .poll(status(request, parent.slug), { timeout: SYNC_TIMEOUT })
    .toBe(200);
  await expect
    .poll(sitemap, { timeout: SYNC_TIMEOUT })
    .toContain(loc(child.slug));
  expect(await sitemap()).toContain(loc(parent.slug));
  await visitor.close();
});

test("rename: child moves to the new slug, old slug 404s, sitemap follows", async ({
  page: studio,
  browser,
  request,
}) => {
  const sitemap = soft(async () => (await request.get("/sitemap.xml")).text());
  const visitor = await visit(browser, [parent.slug, child.slug]);

  await studio.goto(
    `${STUDIO_URL}/presentation/page/${child.id}?preview=${child.slug}`
  );
  const slug = studio.getByPlaceholder(slugInput);
  await expect(slug).toHaveValue(child.slug, { timeout: 90_000 });
  await fillStable(slug, child.renamed);
  await expect
    .poll(
      soft(() => draftSlug(child.id)),
      { timeout: SYNC_TIMEOUT }
    )
    .toBe(child.renamed);
  await studio.getByTestId("action-publish").click();
  await expect
    .poll(
      soft(() =>
        client.fetch("*[_id == $id][0].slug.current", { id: child.id })
      ),
      { timeout: SYNC_TIMEOUT }
    )
    .toBe(child.renamed);

  await expect
    .poll(status(request, child.renamed), { timeout: SYNC_TIMEOUT })
    .toBe(200);
  await expect
    .poll(status(request, child.slug), { timeout: SYNC_TIMEOUT })
    .toBe(404);
  await expect
    .poll(sitemap, { timeout: SYNC_TIMEOUT })
    .toContain(loc(child.renamed));
  const xml = await sitemap();
  expect(xml).not.toContain(loc(child.slug));
  expect(xml).toContain(loc(parent.slug));
  await visitor.close();
});

test("rename: the auto-redirect function records old → new", async () => {
  // Redirects are read at build time in next.config.ts, so only the document
  // is asserted — and only where the Sanity Function is deployed.
  test.skip(
    !process.env.SANITY_E2E_FUNCTIONS_DEPLOYED,
    "SANITY_E2E_FUNCTIONS_DEPLOYED is unset"
  );
  await expect
    .poll(
      soft(() =>
        client.fetch(
          `*[_type == "redirect" && source.current == $source][0].destination.current`,
          { source: child.slug }
        )
      ),
      { timeout: SYNC_TIMEOUT }
    )
    .toBe(child.renamed);
});

test("redirect: Studio rejects a second redirect from the same source", async ({
  page: studio,
}) => {
  await client.createOrReplace({
    _id: `${prefix}redirect-a`,
    _type: "redirect",
    status: "active",
    source: { _type: "slug", current: redirectSource },
    destination: { _type: "slug", current: `/${prefix}new-path` },
    permanent: "true",
  });

  // The second redirect is seeded with a valid destination so that the only
  // thing left blocking publish is the duplicate source.
  await client.createOrReplace({
    _id: `${prefix}redirect-b`,
    _type: "redirect",
    status: "active",
    destination: { _type: "slug", current: `/${prefix}other-destination` },
    permanent: "true",
  });

  await studio.goto(
    `${STUDIO_URL}/intent/edit/id=${prefix}redirect-b;type=redirect/`
  );
  const source = studio.getByTestId("field-source").getByRole("textbox");
  await fillStable(source, redirectSource);
  // The rule queries the dataset, so give it a write's worth of time. The
  // message lives in the collapsed validation panel, so it is attached rather
  // than visible until an editor opens it.
  await expect(
    studio.getByText("a redirect already exists from the source").first()
  ).toBeAttached({ timeout: SYNC_TIMEOUT });
  await expect(studio.getByTestId("action-publish")).toBeDisabled();
});

test("unpublish: parent 404s, child stays live, sitemap drops the parent", async ({
  page: studio,
  browser,
  request,
}) => {
  const sitemap = soft(async () => (await request.get("/sitemap.xml")).text());
  const visitor = await visit(browser, [parent.slug, child.renamed]);

  // Unpublish is hidden in the drafts perspective — `useUnpublishAction`
  // returns null while `selectedPerspective === "drafts"`, which is the
  // default — so open the pane on the published perspective, where an editor
  // reaching for it would be.
  await studio.goto(
    `${STUDIO_URL}/presentation/page/${parent.id}?preview=${parent.slug}&perspective=published`
  );
  // On the published perspective Unpublish replaces Publish as the pane's
  // primary action; the "..." menu still holds only Duplicate and Delete.
  const unpublish = studio.getByTestId("action-unpublish");
  await expect(unpublish).toBeVisible({ timeout: 90_000 });
  await unpublish.click();
  await studio
    .getByRole("dialog")
    .getByRole("button", { name: "Unpublish" })
    .click();
  await expect
    .poll(
      soft(() => client.getDocument(parent.id)),
      { timeout: SYNC_TIMEOUT }
    )
    .toBeUndefined();

  await expect
    .poll(status(request, parent.slug), { timeout: SYNC_TIMEOUT })
    .toBe(404);
  // Children do not depend on the parent document existing.
  expect(await status(request, child.renamed)()).toBe(200);
  await expect
    .poll(sitemap, { timeout: SYNC_TIMEOUT })
    .not.toContain(loc(parent.slug));
  expect(await sitemap()).toContain(loc(child.renamed));
  await visitor.close();
});

test("cleanup: deleted pages 404 and leave the sitemap", async ({
  browser,
  request,
}) => {
  const sitemap = soft(async () => (await request.get("/sitemap.xml")).text());
  const visitor = await visit(browser, [parent.slug, child.renamed]);

  await deleteOwn();

  await expect
    .poll(status(request, child.renamed), { timeout: SYNC_TIMEOUT })
    .toBe(404);
  expect(await status(request, parent.slug)()).toBe(404);
  await expect
    .poll(sitemap, { timeout: SYNC_TIMEOUT })
    .not.toContain(loc(child.renamed));
  expect(await sitemap()).not.toContain(loc(parent.slug));
  await visitor.close();
});
