import { headingChildrenToSlug } from "./heading-slug";
import { getTableOfContents, type TocBlock } from "./table-of-contents";

const heading = (
  style: string,
  _key: string,
  ...texts: string[]
): TocBlock => ({
  _type: "block",
  _key,
  style,
  children: texts.map((text) => ({ _type: "span", text })),
});

test("nests an h4 under the h2 before it when there is no h3", () => {
  const toc = getTableOfContents([
    heading("h2", "a", "Setup"),
    heading("h4", "b", "Environment"),
    heading("h2", "c", "Deploy"),
  ]);

  expect(toc.map((item) => item.text)).toEqual(["Setup", "Deploy"]);
  expect(toc[0]?.children.map((item) => item.text)).toEqual(["Environment"]);
  expect(toc[1]?.children).toEqual([]);
});

test("keeps a leading h3 at the top level", () => {
  const toc = getTableOfContents([
    heading("h3", "a", "Before you start"),
    heading("h2", "b", "Setup"),
    heading("h3", "c", "Tokens"),
  ]);

  expect(toc.map((item) => item.text)).toEqual(["Before you start", "Setup"]);
  expect(toc[1]?.children.map((item) => item.text)).toEqual(["Tokens"]);
});

test("gives a heading split across spans the slug rich text puts on it", () => {
  const children = [
    { _type: "span", text: "Use " },
    { _type: "span", text: "Sanity" },
    { _type: "span", text: " Live" },
  ];
  const [item] = getTableOfContents([
    { _type: "block", _key: "a", style: "h2", children },
  ]);

  expect(item?.text).toBe("Use Sanity Live");
  expect(item?.slug).toBe(headingChildrenToSlug(children));
  expect(item?.slug).toBe("use-sanity-live");
});

test("skips paragraphs, other block types and empty headings", () => {
  const toc = getTableOfContents([
    heading("normal", "a", "Intro"),
    { _type: "image", _key: "b" },
    heading("h2", "c", "   "),
    heading("h2", "d", "Setup"),
  ]);

  expect(toc.map((item) => item.text)).toEqual(["Setup"]);
});

test("prefixes ids with toc- and falls back to the slug without a key", () => {
  const toc = getTableOfContents([
    heading("h2", "abc", "Setup"),
    {
      _type: "block",
      style: "h2",
      children: [{ _type: "span", text: "Deploy" }],
    },
  ]);

  expect(toc.map((item) => item.id)).toEqual(["toc-abc", "toc-deploy"]);
});

test("returns an empty list for missing rich text", () => {
  expect(getTableOfContents(null)).toEqual([]);
  expect(getTableOfContents(undefined)).toEqual([]);
});
