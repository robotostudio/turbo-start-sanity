import { test, expect } from "./fixtures";

test.describe("Smoke: static routes", { tag: "@smoke" }, () => {
  test("home page loads", async ({ page }) => {
    const response = await page.goto("/");

    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("blog index loads", async ({ page }) => {
    const response = await page.goto("/blog");

    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

test.describe("Smoke: dynamic slug pages", { tag: "@smoke" }, () => {
  test("all CMS pages load without errors", async ({
    page,
    slugPages,
    baseURL,
  }) => {
    test.setTimeout(5 * 60_000);

    const allSlugs = [...slugPages.pages, ...slugPages.blogs];

    expect(allSlugs.length).toBeGreaterThan(0);

    const failures: { slug: string; reason: string }[] = [];

    for (const slug of allSlugs) {
      const url = `${baseURL}${slug}`;
      const response = await page.goto(url);
      const status = response?.status() ?? 0;

      if (status !== 200) {
        failures.push({ slug, reason: `status ${status}` });
        continue;
      }

      const title = await page.title();
      if (/404|not found/i.test(title)) {
        failures.push({ slug, reason: "page shows 404" });
        continue;
      }

      const hasContent = await page.evaluate(
        () => document.body.innerText.trim().length > 0,
      );
      if (!hasContent) {
        failures.push({ slug, reason: "page has no visible content" });
      }
    }

    if (failures.length > 0) {
      const report = failures
        .map((f) => `  ${f.slug}: ${f.reason}`)
        .join("\n");
      throw new Error(`${failures.length} page(s) failed:\n${report}`);
    }
  });
});
