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

test("heroToMarkdown renders the video poster markup when resolver is provided", () => {
  const result = heroToMarkdown(
    {
      title: "H",
      video: { light: { poster: { id: "img1", alt: "Hero image" } } },
    },
    { resolveImageUrl: (img) => `https://cdn.example.com/${img.id}.webp` }
  );
  expect(result).toContain("![Hero image](https://cdn.example.com/img1.webp)");
});

test("heroToMarkdown falls back to the dark poster when light is absent", () => {
  const result = heroToMarkdown(
    {
      title: "H",
      video: { dark: { poster: { id: "dark1", alt: "Dark poster" } } },
    },
    { resolveImageUrl: (img) => `https://cdn.example.com/${img.id}.webp` }
  );
  expect(result).toContain(
    "![Dark poster](https://cdn.example.com/dark1.webp)"
  );
});

test("heroToMarkdown falls back to alt text when no resolver is provided", () => {
  const result = heroToMarkdown(
    {
      title: "H",
      video: { light: { poster: { id: "img1", alt: "Fallback text" } } },
    },
    {}
  );
  expect(result).toContain("Fallback text");
  expect(result).not.toContain("![");
});

test("heroToMarkdown omits the image section entirely when there is no poster", () => {
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

test("heroToMarkdown falls back to the dark mux still when light errored", () => {
  const result = heroToMarkdown(
    {
      title: "H",
      video: {
        light: {
          mux: { playbackId: "broken", policy: "public", status: "errored" },
        },
        dark: {
          mux: { playbackId: "works", policy: "public", status: "ready" },
        },
      },
    },
    {}
  );
  expect(result).toContain("https://image.mux.com/works/thumbnail.webp");
  expect(result).not.toContain("broken");
});
