import type { Page } from "@playwright/test";

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

const pageDoc = {
  id: `${prefix}page`,
  slug: `/${prefix}page`,
  title: `E2E page ${runId}`,
  heading: `E2E hero ${runId}`,
};
const postDoc = {
  id: `${prefix}post`,
  slug: `/blog/${prefix}post`,
  title: `E2E post ${runId}`,
};
const authorId = `${prefix}author`;

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

test.describe.configure({ mode: "serial" });

// A retry re-runs the whole file from test 1, which asserts the slug 404s —
// impossible once a previous attempt published it.
test.beforeAll(deleteOwn);

test("new page: draft renders in Presentation, 404s publicly", async ({
  page: studio,
  request,
}) => {
  await studio.goto(
    `${STUDIO_URL}/presentation/page/${pageDoc.id}?preview=${pageDoc.slug}`
  );
  const title = studio.getByTestId("field-title").getByRole("textbox");
  await fillStable(title, pageDoc.title);
  await fillStable(
    studio.getByPlaceholder("e.g., /about-us or /blog/my-post"),
    pageDoc.slug
  );

  // Next's router never leaves the not-found state it entered on first load,
  // and Presentation's refresh button is only a soft RSC refetch — so one hard
  // reload once the slug lands. Every later edit must arrive without one.
  await expect
    .poll(
      soft(() =>
        client.fetch("*[_id == $id][0].slug.current", {
          id: `drafts.${pageDoc.id}`,
        })
      ),
      { timeout: SYNC_TIMEOUT }
    )
    .toBe(pageDoc.slug);
  // `page.frame()` is a snapshot with no auto-wait, and Presentation navigates
  // the iframe asynchronously — so wait for it rather than reading once.
  const onSlug = () =>
    studio.frame({ url: (url) => url.pathname === pageDoc.slug });
  await expect
    .poll(() => onSlug() !== null, { timeout: SYNC_TIMEOUT })
    .toBe(true);
  const frame = onSlug();
  await frame?.evaluate(() => location.reload());

  const preview = studio.frameLocator("iframe");
  await expect(
    preview.getByRole("heading", { level: 1, name: pageDoc.title })
  ).toBeVisible({ timeout: LIVE_TIMEOUT });

  await stamp(frame);
  const edited = `${pageDoc.title} edited`;
  await fillStable(title, edited);
  await expect(
    preview.getByRole("heading", { level: 1, name: edited })
  ).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expectStamped(frame);

  expect(await status(request, pageDoc.slug)()).toBe(404);
  // The Markdown route shares the fetch path, so it must 404 too.
  expect(await status(request, `${pageDoc.slug}.md`)()).toBe(404);
});

test("publish: public page goes live, updates live, keeps new drafts private", async ({
  page: studio,
  browser,
  request,
}) => {
  await client
    .patch(`drafts.${pageDoc.id}`)
    .set({
      pageBuilder: [{ _type: "hero", _key: "hero", title: pageDoc.heading }],
    })
    .commit();

  await studio.goto(
    `${STUDIO_URL}/presentation/page/${pageDoc.id}?preview=${pageDoc.slug}`
  );
  const preview = studio.frameLocator("iframe");
  await expect(
    preview.getByRole("heading", { level: 1, name: pageDoc.heading })
  ).toBeVisible({ timeout: LIVE_TIMEOUT });

  await studio.getByTestId("action-publish").click();
  await expect
    .poll(
      soft(() => client.getDocument(pageDoc.id)),
      {
        timeout: SYNC_TIMEOUT,
      }
    )
    .toBeTruthy();

  // The earlier 404 was cached; Presentation's own live event invalidates it.
  await expect
    .poll(status(request, pageDoc.slug), { timeout: LIVE_TIMEOUT })
    .toBe(200);
  // The .md route was only ever asserted as a 404, so prove it can serve this
  // page too — otherwise a route-wide regression would look like a pass.
  await expect
    .poll(status(request, `${pageDoc.slug}.md`), { timeout: SYNC_TIMEOUT })
    .toBe(200);

  const visitor = await browser.newContext();
  const publicTab = await visitor.newPage();
  await publicTab.goto(pageDoc.slug);
  await expect(publicTab).toHaveTitle(new RegExp(`${pageDoc.title} edited`));
  await expect(
    publicTab.getByRole("heading", {
      level: 1,
      name: pageDoc.heading,
      exact: true,
    })
  ).toBeVisible();

  // SanityLive path: publish straight to the published document and the open
  // visitor tab re-renders on its own.
  await stamp(publicTab);
  const patched = `${pageDoc.heading} patched`;
  await client
    .patch(pageDoc.id)
    .set({ 'pageBuilder[_key=="hero"].title': patched })
    .commit();
  await expect(
    publicTab.getByRole("heading", { level: 1, name: patched, exact: true })
  ).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expectStamped(publicTab);

  const drafted = `${pageDoc.heading} drafted`;
  await studio.getByTestId("field-pageBuilder").getByText(patched).click();
  await fillStable(
    studio
      .getByTestId('field-pageBuilder[_key=="hero"].title')
      .getByRole("textbox"),
    drafted
  );
  await expect(
    preview.getByRole("heading", { level: 1, name: drafted })
  ).toBeVisible({ timeout: LIVE_TIMEOUT });
  await expect(
    publicTab.getByRole("heading", { level: 1, name: patched, exact: true })
  ).toBeVisible();
  await expect(
    publicTab.getByRole("heading", { level: 1, name: drafted, exact: true })
  ).toBeHidden();
  await visitor.close();
});

test("blog: draft post shows in Presentation only, publish lists it", async ({
  page: studio,
  browser,
  request,
}) => {
  await client
    .transaction()
    .createIfNotExists({
      _id: authorId,
      _type: "author",
      name: `E2E author ${runId}`,
    })
    .create({
      _id: `drafts.${postDoc.id}`,
      _type: "blog",
      title: postDoc.title,
      slug: { _type: "slug", current: postDoc.slug },
      authors: [{ _type: "reference", _key: "author", _ref: authorId }],
      category: "sanity",
      publishedAt: new Date().toISOString().slice(0, 10),
      // The list is `order(orderRank asc)` and a missing rank sorts last, onto
      // page 2; this rank sorts before anything the Studio generates.
      orderRank: "0|000000:",
    })
    .commit();

  const preview = studio.frameLocator("iframe");
  // Presentation text carries stega characters, so no `exact` in the iframe.
  await studio.goto(`${STUDIO_URL}/presentation?preview=/blog`);
  await expect(preview.getByRole("link", { name: postDoc.title })).toBeVisible({
    timeout: LIVE_TIMEOUT,
  });
  await studio.goto(`${STUDIO_URL}/presentation?preview=${postDoc.slug}`);
  await expect(
    preview.getByRole("heading", { level: 1, name: postDoc.title })
  ).toBeVisible({ timeout: LIVE_TIMEOUT });

  const blogIndex = await request.get("/blog");
  expect(blogIndex.status()).toBe(200);
  expect(await blogIndex.text()).not.toContain(postDoc.title);
  expect(await status(request, postDoc.slug)()).toBe(404);

  // A visitor on /blog keeps SanityLive listening, which is what invalidates
  // the cached index once the post is published.
  const visitor = await browser.newContext();
  const blogTab = await visitor.newPage();
  await blogTab.goto("/blog");
  await client.action({
    actionType: "sanity.action.document.publish",
    draftId: `drafts.${postDoc.id}`,
    publishedId: postDoc.id,
  });
  await expect(
    blogTab.getByRole("link", { name: postDoc.title, exact: true })
  ).toBeVisible({
    timeout: LIVE_TIMEOUT,
  });
  await expect
    .poll(
      soft(async () => (await request.get("/blog")).text()),
      {
        timeout: SYNC_TIMEOUT,
      }
    )
    .toContain(postDoc.title);
  await expect
    .poll(status(request, postDoc.slug), { timeout: LIVE_TIMEOUT })
    .toBe(200);
  await visitor.close();
});

test("cleanup: deleted documents 404 publicly again", async ({
  browser,
  request,
}) => {
  // Open visitor tabs are what carry the delete events to the site's cache.
  const visitor = await browser.newContext();
  await (await visitor.newPage()).goto(pageDoc.slug);
  await (await visitor.newPage()).goto(postDoc.slug);

  await deleteOwn();

  await expect
    .poll(status(request, pageDoc.slug), { timeout: LIVE_TIMEOUT })
    .toBe(404);
  await expect
    .poll(status(request, postDoc.slug), { timeout: LIVE_TIMEOUT })
    .toBe(404);
  await visitor.close();
});
