import type { Locator, Page } from "@playwright/test";

import {
  client,
  deleteOwn,
  expect,
  LIVE_TIMEOUT,
  prefix,
  runId,
  STUDIO_URL,
  SYNC_TIMEOUT,
  soft,
  test,
} from "./presentation-fixtures";

const doc = {
  id: `${prefix}inline`,
  slug: `/${prefix}inline`,
  title: `E2E inline ${runId}`,
  heading: `E2E inline hero ${runId}`,
};
const draftId = `drafts.${doc.id}`;
const saved = `${doc.heading} one two`;

const heroTitle = () =>
  client.fetch<string | null>(
    `*[_id == $id][0].pageBuilder[_key == "hero"][0].title`,
    { id: draftId }
  );

const boldSpan = () =>
  client.fetch<{ text: string; marks: string[] } | null>(
    `*[_id == $id][0].pageBuilder[_key == "hero"][0].richText[_key == "p"][0].children[_key == "b"][0]{text, marks}`,
    { id: draftId }
  );

// A double-click before the text cursor marks the element armed opens the
// field through stock click-to-edit instead.
const armInlineEdit = async (target: Locator) => {
  await target.hover();
  await expect(target).toHaveCSS("cursor", "text", { timeout: 30_000 });
  await target.dblclick();
  await expect(target).toHaveAttribute("contenteditable", "plaintext-only");
};

const studioTitleField = (studio: Page) =>
  studio
    .getByTestId('field-pageBuilder[_key=="hero"].title')
    .getByRole("textbox");

// Without a field open in the Studio, so the double-click is what opens it.
const openPreview = async (studio: Page) => {
  await studio.goto(`${STUDIO_URL}/presentation?preview=${doc.slug}`);
  return studio.frameLocator("iframe");
};

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await deleteOwn();
  await client.create({
    _id: draftId,
    _type: "page",
    title: doc.title,
    slug: { _type: "slug", current: doc.slug },
    pageBuilder: [
      {
        _type: "hero",
        _key: "hero",
        title: doc.heading,
        richText: [
          {
            _type: "block",
            _key: "p",
            style: "normal",
            markDefs: [],
            children: [
              { _type: "span", _key: "a", text: "Plain then ", marks: [] },
              { _type: "span", _key: "b", text: "bold", marks: ["strong"] },
            ],
          },
        ],
      },
    ],
  });
});

test("double-click types into a heading and Enter saves it once", async ({
  page: studio,
}) => {
  const preview = await openPreview(studio);
  const heading = preview.getByRole("heading", {
    level: 1,
    name: doc.heading,
  });
  await expect(heading).toBeVisible({ timeout: LIVE_TIMEOUT });

  await armInlineEdit(heading);
  await studio.keyboard.type(" one");
  // A click that reached the Studio would open the field and take focus. Give
  // its pane time to have done so.
  await studio.waitForTimeout(5000);
  await studio.keyboard.type(" two");
  await expect(heading).toHaveAttribute("contenteditable", "plaintext-only");
  // Keystrokes that reached the Studio form would have autosaved by now.
  expect(await heroTitle()).toBe(doc.heading);
  // The field must not be open yet, or the assertion after Enter proves nothing.
  await expect(studioTitleField(studio)).toHaveCount(0);

  // Enter must open the field wherever the pointer is.
  await studio.mouse.move(0, 0);
  await studio.keyboard.press("Enter");
  await expect.poll(soft(heroTitle), { timeout: SYNC_TIMEOUT }).toBe(saved);
  await expect(heading).not.toHaveAttribute("contenteditable");
  await expect(studioTitleField(studio)).toHaveValue(saved, {
    timeout: LIVE_TIMEOUT,
  });
});

test("Escape cancels without saving", async ({ page: studio }) => {
  const preview = await openPreview(studio);
  const heading = preview.getByRole("heading", { level: 1, name: saved });
  await expect(heading).toBeVisible({ timeout: LIVE_TIMEOUT });

  const revBefore = await client.fetch<string>("*[_id == $id][0]._rev", {
    id: draftId,
  });
  await armInlineEdit(heading);
  await studio.keyboard.type(" discarded");
  await studio.keyboard.press("Escape");
  await expect(heading).not.toHaveAttribute("contenteditable");
  await expect(heading).not.toContainText("discarded");
  // Long enough for a stray write to land before asserting there was none.
  await studio.waitForTimeout(2000);
  expect(
    await client.fetch<string>("*[_id == $id][0]._rev", { id: draftId })
  ).toBe(revBefore);
});

test("rich text: edits a bold run's words and keeps it bold", async ({
  page: studio,
}) => {
  const preview = await openPreview(studio);
  const bold = preview.locator("strong", { hasText: "bold" });
  await expect(bold).toBeVisible({ timeout: LIVE_TIMEOUT });

  await armInlineEdit(bold);
  await studio.keyboard.type("er");
  await studio.keyboard.press("Enter");
  await expect
    .poll(soft(boldSpan), { timeout: SYNC_TIMEOUT })
    .toEqual({ text: "bolder", marks: ["strong"] });
});
