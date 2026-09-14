import { heroSplitToMarkdown } from "./markdown";

const resolveImageUrl = (image: { id?: string | null }) =>
  `https://cdn.example.com/${image.id}.jpg`;

test("heroSplitToMarkdown returns empty string for a fully empty block", () => {
  expect(heroSplitToMarkdown({}, {})).toBe("");
});

test("heroSplitToMarkdown renders title, subtitle and image joined by blank lines", () => {
  const result = heroSplitToMarkdown(
    {
      title: "Build pages",
      subtitle: "No deploy needed.",
      image: { id: "image-1", alt: "A desk" },
    },
    { resolveImageUrl }
  );
  expect(result).toBe(
    "## Build pages\n\nNo deploy needed.\n\n![A desk](https://cdn.example.com/image-1.jpg)"
  );
});

test("heroSplitToMarkdown lists its buttons after the subtitle", () => {
  const result = heroSplitToMarkdown(
    {
      title: "Build pages",
      subtitle: "No deploy needed.",
      buttons: [
        { _key: "b1", text: "Get started", href: "/start" },
        { _key: "b2", text: "Read the docs", href: "/docs" },
      ],
    },
    {}
  );
  expect(result).toBe(
    "## Build pages\n\nNo deploy needed.\n\n- [Get started](/start)\n- [Read the docs](/docs)"
  );
});

test("heroSplitToMarkdown escapes markdown chars in title and subtitle", () => {
  const result = heroSplitToMarkdown(
    { title: "user_name", subtitle: "#1 [pick]" },
    {}
  );
  expect(result).toBe("## user\\_name\n\n\\#1 \\[pick\\]");
});

test("heroSplitToMarkdown emits no HTML or JSX tags", () => {
  const result = heroSplitToMarkdown(
    { title: "T", subtitle: "S", image: { id: "image-1", alt: "A" } },
    { resolveImageUrl }
  );
  expect(result).not.toMatch(/<\/?[A-Za-z]/);
});
