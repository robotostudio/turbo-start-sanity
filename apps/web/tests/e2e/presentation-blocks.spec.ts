import { type BlockAssets, blockFixtures } from "./fixtures/blocks";
import {
  client,
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
 * Every block in `blockSchemas` must be insertable from the Studio, render in
 * the iframe, and serialize to Markdown. A block registered in the schema but
 * missing from `renderBlockComponent` or `blockToMarkdown` renders blank and
 * nobody notices until a demo, so there is one test per block, named after it.
 *
 * Blocks are seeded with the client rather than driven through the insert menu
 * ten times over; one test covers the menu itself.
 */

const pageDoc = {
  id: `${prefix}blocks`,
  slug: `/${prefix}blocks`,
  title: `E2E blocks ${runId}`,
};

const presentationUrl = `${STUDIO_URL}/presentation/page/${pageDoc.id}?preview=${pageDoc.slug}`;

/** `videoFeature` → `video-feature`, matching the insert menu's `previewImageUrl`. */
const kebab = (name: string) =>
  name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

let assets: BlockAssets = { imageId: null, muxAssetId: null };
let markdown = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  assets = await client.fetch<BlockAssets>(`{
    "imageId": *[_type == "sanity.imageAsset"][0]._id,
    "muxAssetId": *[_type == "mux.videoAsset" && status != "errored" && defined(playbackId) && data.playback_ids[0].policy == "public"][0]._id
  }`);

  await client.createOrReplace({
    _id: `drafts.${pageDoc.id}`,
    _type: "page",
    title: pageDoc.title,
    slug: { _type: "slug", current: pageDoc.slug },
    pageBuilder: blockFixtures.map((fixture) => ({
      _type: fixture.type,
      _key: fixture.type,
      ...fixture.block(assets),
    })),
  });
});

test("the fixture list covers every registered block", async () => {
  // The committed schema is the registry, in real `_type` names — no
  // kebab-case guessing, and it fails when someone skips `studio extract`.
  const { readFile } = await import("node:fs/promises");
  const schema = JSON.parse(
    await readFile(
      new URL("../../../../apps/studio/schema.json", import.meta.url),
      "utf8"
    )
  ) as { name: string; value: { of: { of: { rest: { name: string } }[] } } }[];
  const registered = schema
    .find((type) => type.name === "pageBuilder")
    ?.value.of.of.map((member) => member.rest.name)
    .sort();

  expect(blockFixtures.map((fixture) => fixture.type).sort()).toEqual(
    registered
  );
});

test("the insert menu offers every block", async ({ page: studio }) => {
  await studio.goto(presentationUrl);
  const pageBuilder = studio.getByTestId("field-pageBuilder");
  await expect(pageBuilder).toBeVisible({ timeout: 90_000 });

  // Multi-type arrays label the button "Add item...".
  await pageBuilder.getByRole("button", { name: "Add item" }).first().click();

  for (const fixture of blockFixtures) {
    await expect(
      studio
        .getByRole("menuitem", { name: fixture.title, exact: true })
        .or(studio.getByRole("button", { name: fixture.title, exact: true })),
      `insert menu is missing "${fixture.title}"`
    ).toBeVisible();
  }
});

for (const fixture of blockFixtures) {
  test(`${fixture.type}: thumbnail, iframe render, click-to-edit`, async ({
    page: studio,
    request,
  }) => {
    // Guards the studio's `sync-thumbnails` script.
    const thumbnail = await request.get(
      `${STUDIO_URL}/static/thumbnails/preview-${kebab(fixture.type)}.png`
    );
    expect(
      thumbnail.status(),
      `no insert-menu thumbnail for ${fixture.type}`
    ).toBe(200);

    test.skip(
      Boolean(fixture.requiresImage) && !assets.imageId,
      "dataset holds no image asset"
    );
    // The schema marks the video required, so without one the fixture is not a
    // publishable document and a green test would be meaningless.
    test.skip(
      Boolean(fixture.requiresMux) && !assets.muxAssetId,
      "dataset holds no usable Mux asset"
    );

    await studio.goto(presentationUrl);
    const preview = studio.frameLocator("iframe");

    // An unregistered block renders the "Component not found" placeholder
    // instead, so its own text never appears. A block whose only string is a
    // logo's alt text carries it on the image, not in the DOM text.
    await expect(
      preview
        .getByText(fixture.heading)
        .or(preview.getByAltText(fixture.heading))
        .first(),
      `${fixture.type} does not render its copy in Presentation`
    ).toBeVisible({ timeout: LIVE_TIMEOUT });

    // `createDataAttribute` collapses `pageBuilder[_key=="hero"]` to
    // `path=pageBuilder:hero`, so match the encoded form.
    await expect(
      preview
        .locator(`[data-sanity*="path=pageBuilder:${fixture.type}"]`)
        .first(),
      `${fixture.type} is not wired for click-to-edit`
    ).toBeAttached();
  });
}

test("videoFeature renders the facade, not the player", async ({
  page: studio,
}) => {
  test.skip(!assets.muxAssetId, "dataset holds no ready Mux asset");

  await studio.goto(presentationUrl);
  const preview = studio.frameLocator("iframe");
  // Never pressed: Mux bills delivery, and the player chunk only loads on play.
  await expect(
    preview.getByRole("button", { name: "Play video" }).first()
  ).toBeVisible({ timeout: LIVE_TIMEOUT });
  // The still behind it comes from Mux's image CDN; the poster is decorative
  // (`alt=""`), so it is matched on the source.
  await expect(
    preview.locator('img[src*="image.mux.com"]').first()
  ).toBeAttached();
});

test.describe("markdown", () => {
  test.beforeAll(async ({ request }) => {
    await client.action({
      actionType: "sanity.action.document.publish",
      draftId: `drafts.${pageDoc.id}`,
      publishedId: pageDoc.id,
    });
    await expect
      .poll(
        soft(() => client.getDocument(pageDoc.id)),
        {
          timeout: SYNC_TIMEOUT,
        }
      )
      .toBeTruthy();
    await expect
      .poll(status(request, `${pageDoc.slug}.md`), { timeout: SYNC_TIMEOUT })
      .toBe(200);
    markdown = await (await request.get(`${pageDoc.slug}.md`)).text();
  });

  for (const fixture of blockFixtures) {
    test(`${fixture.type} serializes`, () => {
      test.skip(
        Boolean(fixture.requiresImage) && !assets.imageId,
        "dataset holds no image asset"
      );
      test.skip(
        Boolean(fixture.requiresMux) && !assets.muxAssetId,
        "dataset holds no usable Mux asset"
      );
      // A block with no `blockToMarkdown` case returns "" and vanishes.
      expect(
        markdown,
        `${fixture.type} is missing from the blockToMarkdown switch`
      ).toContain(fixture.heading);
    });
  }

  test("no component leaks as a raw tag", () => {
    // The serializers emit structured Markdown, never JSX — a `<Capitalised`
    // in the output means a component reached the string.
    expect(markdown).not.toMatch(/<[A-Z][A-Za-z]*/);
  });
});

/**
 * The editor's real flow: insert a block from the Studio's own menu, type into
 * it, and watch the preview render it in place.
 *
 * The recorders are the point. A `router.refresh()` in the draft branch of
 * `revalidateSyncTags` once flashed prefetched sibling routes while an editor
 * typed. An end-state assertion cannot see that — the preview flicks away and
 * comes back — so navigations and RSC refetches are recorded as they happen.
 */
test("insert a block from the Studio menu and watch the preview render it", async ({
  page: studio,
  baseURL,
}) => {
  const uiPage = {
    id: `${prefix}ui-insert`,
    slug: `/${prefix}ui-insert`,
    title: `E2E ui insert ${runId}`,
  };
  const blockHeading = `E2E inserted cta ${runId}`;

  await client.createOrReplace({
    _id: `drafts.${uiPage.id}`,
    _type: "page",
    title: uiPage.title,
    slug: { _type: "slug", current: uiPage.slug },
    pageBuilder: [],
  });

  await studio.goto(
    `${STUDIO_URL}/presentation/page/${uiPage.id}?preview=${uiPage.slug}`
  );
  const preview = studio.frameLocator("iframe");
  await expect(
    preview.getByRole("heading", { level: 1, name: uiPage.title })
  ).toBeVisible({ timeout: 90_000 });

  // Record from here: everything after this point must happen in place.
  const visited: string[] = [];
  const rsc: string[] = [];
  studio.on("framenavigated", (frame) => {
    if (frame.parentFrame()) {
      visited.push(new URL(frame.url()).pathname);
    }
  });
  // Origin from `baseURL`, not a hardcoded port: against a deployed preview a
  // port check matches nothing and the assertion below passes vacuously.
  const siteOrigin = new URL(baseURL ?? "http://localhost:3000").origin;
  studio.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === siteOrigin && url.searchParams.has("_rsc")) {
      rsc.push(url.pathname);
    }
  });

  const pageBuilder = studio.getByTestId("field-pageBuilder");
  await pageBuilder.getByRole("button", { name: "Add item" }).first().click();
  await studio
    .getByRole("menuitem", { name: "Cta", exact: true })
    .or(studio.getByRole("button", { name: "Cta", exact: true }))
    .first()
    .click();

  // The Studio generates the `_key`, so read it back rather than guessing.
  await expect
    .poll(
      soft(async () => {
        const doc = await client.getDocument(`drafts.${uiPage.id}`);
        return (
          (doc?.pageBuilder as { _key: string }[] | undefined)?.length ?? 0
        );
      }),
      { timeout: SYNC_TIMEOUT }
    )
    .toBe(1);
  const draft = await client.getDocument(`drafts.${uiPage.id}`);
  const inserted = (draft?.pageBuilder ?? []) as { _key: string }[];
  expect(inserted, "the insert menu did not add a block").toHaveLength(1);
  const blockKey = inserted[0]?._key ?? "";

  await fillStable(
    studio
      .getByTestId(`field-pageBuilder[_key=="${blockKey}"].title`)
      .getByRole("textbox"),
    blockHeading
  );

  // The block reaches the preview without a reload…
  await expect(
    preview.getByText(blockHeading).first(),
    "the inserted block never rendered in the preview"
  ).toBeVisible({ timeout: SYNC_TIMEOUT });
  // …and click-to-edit is wired to the key the Studio just generated.
  await expect(
    preview.locator(`[data-sanity*="path=pageBuilder:${blockKey}"]`).first()
  ).toBeAttached();

  // The preview never pointed at another route while any of that happened.
  expect(
    visited.filter((pathname) => pathname !== uiPage.slug),
    `preview navigated away while editing: ${visited.join(" -> ")}`
  ).toEqual([]);

  // And it never re-fetched its own route. `router.refresh()` refetches the
  // current route; Next's link prefetching only ever touches sibling routes.
  // That difference is the bug: a `"refresh"` returned from the draft branch
  // of `revalidateSyncTags` refreshes the router on every live event, and the
  // preview flashes the prefetched siblings. `updateTag` alone surfaces a
  // draft edit.
  expect(
    rsc.filter((pathname) => pathname === uiPage.slug),
    "the preview refreshed its own route while editing — a draft edit must not trigger router.refresh()"
  ).toEqual([]);
});
