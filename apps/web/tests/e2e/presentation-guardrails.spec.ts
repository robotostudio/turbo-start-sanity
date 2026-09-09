import { getBlogPaginationRange } from "@/utils";
import {
  client,
  expect,
  fillStable,
  html,
  LIVE_TIMEOUT,
  PUBLISHED,
  prefix,
  runId,
  STUDIO_URL,
  SYNC_TIMEOUT,
  soft,
  status,
  test,
} from "./presentation-fixtures";

/**
 * "What if an editor does the wrong thing" guardrails: validation
 * blocks publish, SEO overrides and noindex reach the public metadata and the
 * sitemap, the revalidate webhook fails closed, and drafts never leak into
 * the public blog index. Self-contained: every document it touches carries
 * this run's prefix and the fixture deletes it.
 *
 * Out of scope: Mux uploads (billed per upload), the Unsplash picker and AI
 * Assist (both external services).
 */

const invalidPage = {
  id: `${prefix}invalid`,
  slug: `/${prefix}invalid`,
  title: `E2E invalid ${runId}`,
};
const seoPage = {
  id: `${prefix}seo`,
  slug: `/${prefix}seo`,
  title: `E2E seo page ${runId}`,
  seoTitle: `E2E seo title ${runId}`,
  seoDescription: `E2E seo description ${runId}`,
};
// Its own id: presentation.spec.ts owns `${prefix}author`.
const authorId = `${prefix}seo-author`;
const BLOG_CATEGORY = "aeo";
// `BLOG_LIST_PAGE_SIZE` is not exported; page 2 starts where page 1 ends.
const BLOG_LIST_PAGE_SIZE = getBlogPaginationRange(2).start;

test.describe.configure({ mode: "serial" });

test("validation: publish stays disabled until title and slug are filled", async ({
  page: studio,
}) => {
  await studio.goto(
    `${STUDIO_URL}/presentation/page/${invalidPage.id}?preview=/`
  );
  // A document with no edits does not exist yet, and an empty form carries no
  // validation markers; one keystroke creates the draft and validates it.
  const description = studio
    .getByTestId("field-description")
    .getByRole("textbox");
  await expect(description).toBeVisible({ timeout: 90_000 });
  await fillStable(description, "An editor forgot the title and the slug.");
  await expect
    .poll(
      soft(() => client.getDocument(`drafts.${invalidPage.id}`)),
      {
        timeout: SYNC_TIMEOUT,
      }
    )
    .toBeTruthy();

  const publish = studio.getByTestId("action-publish");
  await expect(publish).toBeDisabled();

  // The pane header's validation button opens the inspector, which lists one
  // card (a button) per marker: field breadcrumb plus message.
  await studio.getByRole("button", { name: "Validation" }).click();
  await expect(
    studio.getByRole("button", { name: "A page title is required" })
  ).toBeVisible();
  await expect(
    studio.getByRole("button", { name: "Slug must have a value" })
  ).toBeVisible();

  await fillStable(
    studio.getByTestId("field-title").getByRole("textbox"),
    invalidPage.title
  );
  await fillStable(
    studio.getByPlaceholder("e.g., /about-us or /blog/my-post"),
    invalidPage.slug
  );
  // Slug validation includes an async uniqueness query.
  await expect(
    studio.getByRole("button", { name: "A page title is required" })
  ).toBeHidden({ timeout: SYNC_TIMEOUT });
  await expect(
    studio.getByRole("button", { name: "Slug must have a value" })
  ).toBeHidden({ timeout: SYNC_TIMEOUT });
  await expect(publish).toBeEnabled({ timeout: SYNC_TIMEOUT });
});

test("seo: overrides reach the metadata, noindex hides the page from the sitemap", async ({
  browser,
  request,
}) => {
  // Never the settings OG image: `seo.ts` falls back to it and both produce
  // the same URL shape, so it would satisfy the assertion without `seoImage`
  // being read at all.
  const fallback = await client.fetch<string | null>(
    `*[_type == "settings"][0].ogImage.asset._ref`,
    {},
    PUBLISHED
  );
  const asset = await client.fetch<{ _id: string; url: string } | null>(
    `*[_type == "sanity.imageAsset" && _id != $fallback][0]{_id, url}`,
    { fallback: fallback ?? "" },
    PUBLISHED
  );
  await client.createOrReplace({
    _id: seoPage.id,
    _type: "page",
    title: seoPage.title,
    slug: { _type: "slug", current: seoPage.slug },
    seoTitle: seoPage.seoTitle,
    seoDescription: seoPage.seoDescription,
    // Published indexable first: the sitemap is a cached route, so its later
    // absence only means something once it has been seen to contain the slug.
    seoNoIndex: false,
    ...(asset && {
      seoImage: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      },
    }),
  });
  await expect
    .poll(status(request, seoPage.slug), { timeout: SYNC_TIMEOUT })
    .toBe(200);

  const visitor = await browser.newContext();
  const publicTab = await visitor.newPage();
  await publicTab.goto(seoPage.slug);
  await expect(publicTab).toHaveTitle(new RegExp(seoPage.seoTitle));
  await expect(publicTab.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    seoPage.seoDescription
  );
  // Annotated rather than skipped: `test.skip` here would abandon the robots
  // and sitemap assertions below, which have nothing to do with the image.
  if (asset) {
    await expect(
      publicTab.locator('meta[property="og:image"]').first()
    ).toHaveAttribute("content", new RegExp(`^${asset.url}`));
  } else {
    test.info().annotations.push({
      type: "skipped",
      description: "no image asset besides the settings og:image",
    });
  }

  await expect(publicTab.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /index, follow/
  );

  const sitemapLocs = html(request, "/sitemap.xml");
  await expect
    .poll(sitemapLocs, { timeout: SYNC_TIMEOUT })
    .toContain(`${seoPage.slug}<`);

  // The open visitor tab carries the change into the site's cache; the
  // sitemap's entry shares the document's sync tag.
  await client.patch(seoPage.id).set({ seoNoIndex: true }).commit();
  await expect
    .poll(sitemapLocs, { timeout: SYNC_TIMEOUT })
    .not.toContain(`${seoPage.slug}<`);
  await expect(publicTab.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
    { timeout: SYNC_TIMEOUT }
  );

  await client.patch(seoPage.id).set({ seoNoIndex: false }).commit();
  await expect
    .poll(sitemapLocs, { timeout: SYNC_TIMEOUT })
    .toContain(`${seoPage.slug}<`);
  await visitor.close();
});

test.describe("revalidate webhook fails closed", () => {
  const route = "/api/revalidate-sync-tags";
  const data = { syncTags: ["e2e"] };

  test("no Authorization header is 401", async ({ request }) => {
    expect((await request.post(route, { data })).status()).toBe(401);
  });

  test("wrong secret is 401", async ({ request }) => {
    const response = await request.post(route, {
      data,
      headers: { Authorization: `Bearer wrong-${runId}` },
    });
    expect(response.status()).toBe(401);
  });

  test("correct secret revalidates", async ({ request }) => {
    const secret = process.env.SANITY_REVALIDATE_SECRET;
    test.skip(!secret, "SANITY_REVALIDATE_SECRET is not set");
    const response = await request.post(route, {
      data,
      headers: { Authorization: `Bearer ${secret}` },
    });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({
      revalidated: true,
      syncTags: data.syncTags,
    });
  });
});

test("blog index: drafts filter by category and paginate in Presentation only", async ({
  page: studio,
  request,
}) => {
  const published = await client.fetch<number>(
    `count(*[_type == "blog" && defined(slug.current) && seoHideFromLists != true && featured != true])`,
    {},
    PUBLISHED
  );
  // Land the total one item past the current last page, so the drafts must
  // add a page: a pagination control that ignored them would keep the old
  // page count and the assertion below would miss its link.
  const basePages = Math.max(1, Math.ceil(published / BLOG_LIST_PAGE_SIZE));
  const count = Math.max(3, basePages * BLOG_LIST_PAGE_SIZE + 1 - published);
  const expectedPages = Math.ceil((published + count) / BLOG_LIST_PAGE_SIZE);
  const posts = Array.from({ length: count }, (_, i) => ({
    id: `${prefix}post-${i}`,
    slug: `/blog/${prefix}post-${i}`,
    title: `E2E guardrail post ${i} ${runId}`,
  }));

  const tx = client.transaction().createIfNotExists({
    _id: authorId,
    _type: "author",
    name: `E2E author ${runId}`,
  });
  for (const [i, post] of posts.entries()) {
    tx.create({
      _id: `drafts.${post.id}`,
      _type: "blog",
      title: post.title,
      slug: { _type: "slug", current: post.slug },
      authors: [{ _type: "reference", _key: "author", _ref: authorId }],
      category: BLOG_CATEGORY,
      publishedAt: new Date().toISOString().slice(0, 10),
      // The list is `order(orderRank asc)` and a missing rank sorts last;
      // these sort before anything the Studio generates, onto page 1.
      orderRank: `0|${String(i + 1).padStart(6, "0")}:`,
    });
  }
  await tx.commit();

  const preview = studio.frameLocator("iframe");
  const categoryPath = `/blog?category=${BLOG_CATEGORY}`;
  await studio.goto(
    `${STUDIO_URL}/presentation?preview=${encodeURIComponent(categoryPath)}`
  );
  // Presentation text carries stega characters, so no `exact` in the iframe.
  for (const post of posts.slice(0, 3)) {
    await expect(preview.getByRole("link", { name: post.title })).toBeVisible({
      timeout: LIVE_TIMEOUT,
    });
  }

  await studio.goto(`${STUDIO_URL}/presentation?preview=/blog`);
  const pagination = preview.getByRole("navigation", {
    name: "Blog pagination",
  });
  await expect(pagination).toBeVisible({ timeout: LIVE_TIMEOUT });
  // `aria-label` sets the accessible name (blog-pagination.tsx), and the window
  // around the current page truncates — only the last page is always rendered,
  // so assert on that one. It may exceed `expectedPages` if other drafts exist.
  const pageLinks = pagination.getByRole("link", { name: /^Go to page \d+$/ });
  // Polled, not read once: the drafts reach the listing over the live channel
  // after the first render, so a single read catches the pre-draft page count.
  await expect
    .poll(
      soft(async () => {
        const label = await pageLinks.last().getAttribute("aria-label");
        return Number(label?.replace(/\D+/g, ""));
      }),
      {
        message: `drafts did not push the listing past ${basePages} pages`,
        timeout: LIVE_TIMEOUT,
      }
    )
    .toBeGreaterThanOrEqual(expectedPages);

  for (const path of [categoryPath, "/blog"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    for (const post of posts) {
      expect(html, `${post.title} leaked to ${path}`).not.toContain(post.title);
    }
  }
});
