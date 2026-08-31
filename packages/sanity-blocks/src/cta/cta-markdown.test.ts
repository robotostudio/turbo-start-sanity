import { ctaToMarkdown } from "./markdown";

const para = (text: string) => [
  {
    _type: "block",
    style: "normal",
    children: [{ _type: "span", text }],
  },
];

test("ctaToMarkdown returns empty string for a fully empty block", () => {
  expect(ctaToMarkdown({}, {})).toBe("");
});

test("ctaToMarkdown renders eyebrow, title, and richText joined by blank lines", () => {
  const result = ctaToMarkdown(
    {
      eyebrow: "New",
      title: "Launch",
      richText: para("Get started today."),
    },
    {}
  );
  expect(result).toBe("**New**\n\n## Launch\n\nGet started today.");
});

test("ctaToMarkdown escapes markdown chars in eyebrow", () => {
  const result = ctaToMarkdown({ eyebrow: "#1 _Pick_" }, {});
  expect(result).toBe("**\\#1 \\_Pick\\_**");
});

test("ctaToMarkdown escapes markdown chars in title", () => {
  const result = ctaToMarkdown({ title: "user_name & [more]" }, {});
  expect(result).toBe("## user\\_name & \\[more\\]");
});

test("ctaToMarkdown renders buttons as a Markdown list", () => {
  const result = ctaToMarkdown(
    {
      title: "CTA",
      buttons: [
        { _key: "b1", text: "Start", href: "/start" },
        { _key: "b2", text: "Learn more", href: "#" },
      ],
    },
    {}
  );
  expect(result).toContain("- [Start](/start)");
  expect(result).toContain("- Learn more");
  expect(result).not.toContain("(#)");
});

test("ctaToMarkdown handles undefined richText without throwing", () => {
  expect(() =>
    ctaToMarkdown({ title: "T", richText: undefined }, {})
  ).not.toThrow();
});

test("ctaToMarkdown emits no HTML or JSX tags", () => {
  const result = ctaToMarkdown(
    { eyebrow: "E", title: "T", richText: para("Body.") },
    {}
  );
  expect(result).not.toMatch(/<[A-Za-z]/);
});
