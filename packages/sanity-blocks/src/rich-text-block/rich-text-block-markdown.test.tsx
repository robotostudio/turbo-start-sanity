import { richTextBlockToMarkdown } from "./markdown";

const para = (text: string) => [
  {
    _type: "block",
    style: "normal",
    children: [{ _type: "span", text }],
  },
];

test("richTextBlockToMarkdown returns empty string for a fully empty block", () => {
  expect(richTextBlockToMarkdown({}, {})).toBe("");
});

test("richTextBlockToMarkdown renders eyebrow and title", () => {
  const result = richTextBlockToMarkdown(
    { eyebrow: "Context", title: "Our Story" },
    {}
  );
  expect(result).toBe("**Context**\n\n## Our Story");
});

test("richTextBlockToMarkdown renders richText without eyebrow or title", () => {
  const result = richTextBlockToMarkdown(
    { richText: para("Just a paragraph.") },
    {}
  );
  expect(result).toBe("Just a paragraph.");
});

test("richTextBlockToMarkdown escapes markdown chars in eyebrow", () => {
  const result = richTextBlockToMarkdown({ eyebrow: "#featured *post*" }, {});
  expect(result).toBe("**\\#featured \\*post\\***");
});

test("richTextBlockToMarkdown escapes markdown chars in title", () => {
  const result = richTextBlockToMarkdown(
    { title: "Why user_name matters" },
    {}
  );
  expect(result).toBe("## Why user\\_name matters");
});

test("richTextBlockToMarkdown handles undefined richText without throwing", () => {
  expect(() =>
    richTextBlockToMarkdown({ title: "T", richText: undefined }, {})
  ).not.toThrow();
});

test("richTextBlockToMarkdown emits no HTML or JSX tags", () => {
  const result = richTextBlockToMarkdown(
    { eyebrow: "E", title: "T", richText: para("Body.") },
    {}
  );
  expect(result).not.toMatch(/<[A-Za-z]/);
});
