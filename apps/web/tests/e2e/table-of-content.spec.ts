import { expect, test } from "./fixtures";

// Desktop tree only — the mobile one renders the same anchors behind a
// disclosure and would double every assertion.
const TOC_LINKS = 'nav[aria-labelledby="toc-heading"] a';

async function becomesActive(link: import("@playwright/test").Locator) {
  try {
    await expect(link).toHaveAttribute("aria-current", "location", {
      timeout: 3000,
    });
    return true;
  } catch {
    return false;
  }
}

// Never waits: an empty result is the interesting case, not a timeout.
async function activeLabel(page: import("@playwright/test").Page) {
  const active = page.locator(`${TOC_LINKS}[aria-current="location"]`);
  if ((await active.count()) === 0) {
    return "nothing";
  }
  return (await active.first().textContent())?.trim() ?? "nothing";
}

test.describe("table of contents", () => {
  // Every blog post, every heading, each with a retrying assertion.
  test.setTimeout(300_000);

  test("clicking a heading highlights that heading, not the one above", async ({
    page,
    slugPages,
  }) => {
    const failures: string[] = [];
    let checked = 0;

    for (const slug of slugPages.blogs) {
      await page.goto(slug);
      const links = page.locator(TOC_LINKS);
      const count = await links.count();
      if (count < 2) {
        continue;
      }

      for (let i = 0; i < count; i++) {
        const link = links.nth(i);
        const label = (await link.textContent())?.trim() ?? `#${i}`;
        await link.click();
        checked++;
        // Retries while the smooth scroll runs — there is no completion event,
        // and polling scrollY for stability reports "settled" before it starts.
        if (!(await becomesActive(link))) {
          failures.push(
            `${slug} — clicked "${label}", highlighted "${await activeLabel(page)}"`
          );
        }
      }
    }

    expect(
      checked,
      "no blog post rendered a multi-heading TOC"
    ).toBeGreaterThan(0);
    expect(failures).toEqual([]);
  });

  test("the last heading is reachable at the bottom of the page", async ({
    page,
    slugPages,
  }) => {
    const failures: string[] = [];
    let checked = 0;

    for (const slug of slugPages.blogs) {
      await page.goto(slug);
      const links = page.locator(TOC_LINKS);
      const count = await links.count();
      if (count < 2) {
        continue;
      }

      await page.evaluate(async () => {
        // Content streams in, so one scrollTo lands short of the real bottom.
        for (let i = 0; i < 20; i++) {
          window.scrollTo(0, document.documentElement.scrollHeight);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      });
      checked++;

      const last = links.nth(count - 1);
      if (!(await becomesActive(last))) {
        failures.push(
          `${slug} — at page bottom, highlighted "${await activeLabel(page)}" instead of the last heading`
        );
      }
    }

    expect(checked).toBeGreaterThan(0);
    expect(failures).toEqual([]);
  });
});
