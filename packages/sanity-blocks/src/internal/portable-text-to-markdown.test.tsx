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

  // Official lib uses 3-space indent per level (CommonMark-compliant).
  expect(md).toBe("- First\n   - Nested\n1. Step");
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

test("keeps code-span text raw and fences embedded backticks", () => {
  expect(
    portableTextToMarkdown([
      {
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: "a_b", marks: ["code"] }],
      },
    ])
  ).toBe("`a_b`");

  expect(
    portableTextToMarkdown([
      {
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: "a`b", marks: ["code"] }],
      },
    ])
  ).toBe("``a`b``");
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

test("passes span text through without escaping Markdown metacharacters", () => {
  // The official library does not escape raw body text — callers that need
  // escaped plain-string output should use `escapeMarkdown` directly.
  const md = portableTextToMarkdown([
    {
      _type: "block",
      style: "normal",
      children: [{ _type: "span", text: "user_name_field and foo[bar]" }],
    },
  ]);

  expect(md).toBe("user_name_field and foo[bar]");
});

// ─── block-leading escaping ───────────────────────────────────────────────────
// The official lib does not escape block-leading markers, so a normal paragraph
// whose text starts with `- x`, `> x`, etc. would render as a list / blockquote
// / heading / thematic break. Our custom `block.normal` renderer escapes them.

test("block-leading: escapes bullet, plus, and star markers at paragraph start", () => {
  for (const [text, expected] of [
    ["- x", "\\- x"],
    ["+ item", "\\+ item"],
    ["* star", "\\* star"],
  ] as const) {
    expect(
      portableTextToMarkdown([
        {
          _type: "block",
          style: "normal",
          children: [{ _type: "span", text }],
        },
      ])
    ).toBe(expected);
  }
});

test("block-leading: escapes ordered-list markers (period and paren) at paragraph start", () => {
  for (const [text, expected] of [
    ["1. x", "1\\. x"],
    ["2) y", "2\\) y"],
    ["10. z", "10\\. z"],
  ] as const) {
    expect(
      portableTextToMarkdown([
        {
          _type: "block",
          style: "normal",
          children: [{ _type: "span", text }],
        },
      ])
    ).toBe(expected);
  }
});

test("block-leading: escapes blockquote marker at paragraph start", () => {
  expect(
    portableTextToMarkdown([
      {
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: "> quoted" }],
      },
    ])
  ).toBe("\\> quoted");
});

test("block-leading: escapes ATX heading markers at paragraph start", () => {
  for (const [text, expected] of [
    ["# H1", "\\# H1"],
    ["## H2", "\\## H2"],
    ["###### H6", "\\###### H6"],
  ] as const) {
    expect(
      portableTextToMarkdown([
        {
          _type: "block",
          style: "normal",
          children: [{ _type: "span", text }],
        },
      ])
    ).toBe(expected);
  }
});

test("block-leading: escapes thematic break sequences in normal paragraphs", () => {
  for (const text of ["---", "***", "___"]) {
    expect(
      portableTextToMarkdown([
        {
          _type: "block",
          style: "normal",
          children: [{ _type: "span", text }],
        },
      ])
    ).toMatch(/^\\/);
  }
});

test("block-leading: real bullet and number listItems still render as list markers (not escaped)", () => {
  const md = portableTextToMarkdown([
    {
      _type: "block",
      listItem: "bullet",
      level: 1,
      children: [{ _type: "span", text: "Bullet" }],
    },
    {
      _type: "block",
      listItem: "number",
      level: 1,
      children: [{ _type: "span", text: "Step" }],
    },
  ]);
  expect(md).toContain("- Bullet");
  expect(md).toContain("1. Step");
});

test("block-leading: inline underscores in normal paragraphs are not over-escaped (guard)", () => {
  // The block.normal wrapper must only touch block-leading markers, never
  // inline characters like underscores that the lib deliberately leaves raw.
  expect(
    portableTextToMarkdown([
      {
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: "user_name_field" }],
      },
    ])
  ).toBe("user_name_field");
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
