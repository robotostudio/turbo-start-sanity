import { heroToMarkdown } from "./markdown";

const para = (text: string) => [
  {
    _type: "block",
    style: "normal",
    children: [{ _type: "span", text }],
  },
];

test("heroToMarkdown returns empty string for a fully empty block", () => {
  expect(heroToMarkdown({}, {})).toBe("");
});

test("heroToMarkdown renders badge, title, and richText", () => {
  const result = heroToMarkdown(
    { badge: "v2", title: "Welcome", richText: para("Hello!") },
    {}
  );
  expect(result).toBe("**v2**\n\n## Welcome\n\nHello!");
});

test("heroToMarkdown escapes markdown chars in badge", () => {
  const result = heroToMarkdown({ badge: "#1 _top_" }, {});
  expect(result).toBe("**\\#1 \\_top\\_**");
});

test("heroToMarkdown escapes markdown chars in title", () => {
  const result = heroToMarkdown({ title: "[New] Release" }, {});
  expect(result).toBe("## \\[New\\] Release");
});

test("heroToMarkdown renders image markup when resolver is provided", () => {
  const result = heroToMarkdown(
    { title: "H", image: { id: "img1", alt: "Hero image" } },
    { resolveImageUrl: (img) => `https://cdn.example.com/${img.id}.webp` }
  );
  expect(result).toContain("![Hero image](https://cdn.example.com/img1.webp)");
});

test("heroToMarkdown falls back to alt text when no resolver is provided", () => {
  const result = heroToMarkdown(
    { title: "H", image: { id: "img1", alt: "Fallback text" } },
    {}
  );
  expect(result).toContain("Fallback text");
  expect(result).not.toContain("![");
});

test("heroToMarkdown omits image section entirely when image is absent", () => {
  const result = heroToMarkdown({ title: "No image" }, {});
  expect(result).toBe("## No image");
  expect(result).not.toContain("![");
});

test("heroToMarkdown renders a hash-href button as plain text", () => {
  const result = heroToMarkdown(
    {
      buttons: [
        { text: "Go", href: "/go" },
        { text: "Noop", href: "#" },
      ],
    },
    {}
  );
  expect(result).toContain("- [Go](/go)");
  expect(result).toContain("- Noop");
  expect(result).not.toContain("(#)");
});

test("heroToMarkdown does not emit HTML or JSX tags", () => {
  const result = heroToMarkdown(
    { badge: "B", title: "T", richText: para("Body.") },
    {}
  );
  expect(result).not.toMatch(/<[A-Za-z]/);
});
