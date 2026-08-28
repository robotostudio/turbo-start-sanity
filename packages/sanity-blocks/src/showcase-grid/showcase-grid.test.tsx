import type { ShowcaseGridItem } from "@workspace/sanity-blocks/showcase-grid/index";
import { ShowcaseGrid } from "@workspace/sanity-blocks/showcase-grid/index";
import { renderToStaticMarkup } from "react-dom/server";

function item(
  key: string,
  overrides: Partial<ShowcaseGridItem> = {}
): ShowcaseGridItem {
  return {
    _key: key,
    siteName: `Site ${key}`,
    screenshot: { id: `image-${key}abc123-1200x800-png`, alt: `Site ${key}` },
    ...overrides,
  };
}

test("ShowcaseGrid promotes the first item when nothing is flagged featured", () => {
  const html = renderToStaticMarkup(
    <ShowcaseGrid items={[item("a"), item("b"), item("c")]} title="Showcase" />
  );

  expect(html).toContain("Site a");
  expect(html).toContain("Site b");
  expect(html).toContain("Site c");
});

test("ShowcaseGrid honours an explicit featured flag", () => {
  const html = renderToStaticMarkup(
    <ShowcaseGrid
      items={[item("a"), item("b", { featured: true }), item("c")]}
      title="Showcase"
    />
  );

  expect(html).toContain("Site a");
  expect(html).toContain("Site b");
  expect(html).toContain("Site c");
});

test("ShowcaseGrid links a card out when it has a url", () => {
  const html = renderToStaticMarkup(
    <ShowcaseGrid
      items={[item("a", { url: "https://example.com" })]}
      title="Showcase"
    />
  );

  expect(html).toContain('href="https://example.com"');
  expect(html).toContain('rel="noopener noreferrer"');
});

test("ShowcaseGrid drops a javascript: url rather than rendering it", () => {
  const html = renderToStaticMarkup(
    <ShowcaseGrid
      items={[item("a", { url: "javascript:alert(1)" })]}
      title="Showcase"
    />
  );

  expect(html).not.toContain("javascript:");
});

test("ShowcaseGrid renders a heading-only section when there are no items", () => {
  const html = renderToStaticMarkup(
    <ShowcaseGrid items={[]} title="Showcase" />
  );

  expect(html).toContain("Showcase");
});
