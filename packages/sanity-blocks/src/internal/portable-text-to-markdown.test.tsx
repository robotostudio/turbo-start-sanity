import { portableTextToMarkdown } from "@workspace/sanity-blocks/internal/portable-text-to-markdown";

test("returns empty string for missing or empty input", () => {
  expect(portableTextToMarkdown(undefined)).toBe("");
  expect(portableTextToMarkdown(null)).toBe("");
  expect(portableTextToMarkdown([])).toBe("");
});

test("serializes headings, paragraphs and blockquotes", () => {
  const md = portableTextToMarkdown([
    {
      _type: "block",
      style: "h2",
      children: [{ _type: "span", text: "Heading" }],
    },
    {
      _type: "block",
      style: "normal",
      children: [{ _type: "span", text: "A paragraph." }],
    },
    {
      _type: "block",
      style: "blockquote",
      children: [{ _type: "span", text: "A quote." }],
    },
    {
      _type: "block",
      style: "normal",
      children: [{ _type: "span", text: "   " }],
    },
  ]);

  expect(md).toBe("## Heading\n\nA paragraph.\n\n> A quote.");
});

test("applies decorators and custom links", () => {
  const md = portableTextToMarkdown([
    {
      _type: "block",
      style: "normal",
      markDefs: [{ _key: "link1", _type: "customLink", href: "/features" }],
      children: [
        { _type: "span", text: "Bold ", marks: ["strong"] },
        { _type: "span", text: "and code", marks: ["code"] },
        { _type: "span", text: " and " },
        { _type: "span", text: "a link", marks: ["link1"] },
      ],
    },
  ]);

  expect(md).toBe("**Bold **`and code` and [a link](/features)");
});

test("nests bullet and numbered lists and keeps them grouped", () => {
  const md = portableTextToMarkdown([
    {
      _type: "block",
      listItem: "bullet",
      level: 1,
      children: [{ _type: "span", text: "First" }],
    },
    {
      _type: "block",
      listItem: "bullet",
      level: 2,
      children: [{ _type: "span", text: "Nested" }],
    },
    {
      _type: "block",
      listItem: "number",
      level: 1,
      children: [{ _type: "span", text: "Step" }],
    },
  ]);

  expect(md).toBe("- First\n  - Nested\n1. Step");
});

test("renders images via the resolver and falls back to text without one", () => {
  const withUrl = portableTextToMarkdown(
    [
      {
        _type: "image",
        id: "image-abc",
        alt: "A diagram",
        caption: "Figure 1",
      },
    ],
    { resolveImageUrl: () => "https://cdn.example.com/img.webp" }
  );
  expect(withUrl).toBe(
    "![A diagram](https://cdn.example.com/img.webp)\n\n_Figure 1_"
  );

  const withoutUrl = portableTextToMarkdown([
    { _type: "image", id: "image-abc", alt: "A diagram" },
  ]);
  expect(withoutUrl).toBe("A diagram");
});

test("wraps link URLs containing parens or spaces in angle brackets", () => {
  const md = portableTextToMarkdown([
    {
      _type: "block",
      style: "normal",
      markDefs: [{ _key: "l", _type: "customLink", href: "/foo_(bar)" }],
      children: [{ _type: "span", text: "link", marks: ["l"] }],
    },
  ]);

  expect(md).toBe("[link](</foo_(bar)>)");
});

test("escapes literal Markdown metacharacters in span text", () => {
  const md = portableTextToMarkdown([
    {
      _type: "block",
      style: "normal",
      children: [{ _type: "span", text: "user_name_field and foo[bar]" }],
    },
  ]);

  expect(md).toBe("user\\_name\\_field and foo\\[bar\\]");
});

test("never emits raw JSX-style tags", () => {
  const md = portableTextToMarkdown([
    {
      _type: "block",
      style: "h3",
      children: [{ _type: "span", text: "Section" }],
    },
  ]);
  expect(md).not.toMatch(/<[A-Za-z]/);
});
