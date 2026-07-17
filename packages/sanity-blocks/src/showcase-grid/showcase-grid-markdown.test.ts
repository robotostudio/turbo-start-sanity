import { showcaseGridToMarkdown } from "./markdown";

test("showcaseGridToMarkdown returns empty string for a fully empty block", () => {
  expect(showcaseGridToMarkdown({}, {})).toBe("");
});

test("showcaseGridToMarkdown renders the eyebrow, title and description", () => {
  const result = showcaseGridToMarkdown(
    {
      eyebrow: "Showcase",
      title: "Real sites. Real traffic.",
      description: "Every site here started from the same template.",
    },
    {}
  );
  expect(result).toContain("**Showcase**");
  expect(result).toContain("## Real sites. Real traffic.");
  expect(result).toContain("Every site here started from the same template.");
});

test("showcaseGridToMarkdown renders items as a linked list", () => {
  const result = showcaseGridToMarkdown(
    {
      items: [
        { _key: "i1", siteName: "Volvo Chile", url: "https://volvo.cl" },
        { _key: "i2", siteName: "No Link Site" },
      ],
    },
    {}
  );
  expect(result).toContain("- [Volvo Chile](https://volvo.cl)");
  // An item without a URL degrades to plain text, not a link.
  expect(result).toContain("- No Link Site");
  expect(result).not.toContain("No Link Site](");
});

test("showcaseGridToMarkdown falls back to the attribution name and skips nameless items", () => {
  const result = showcaseGridToMarkdown(
    {
      items: [
        { _key: "i1", attributionName: "Roboto", url: "https://roboto.studio" },
        { _key: "i2", url: "https://nameless.example.com" },
      ],
    },
    {}
  );
  expect(result).toContain("- [Roboto](https://roboto.studio)");
  expect(result).not.toContain("nameless.example.com");
});

test("showcaseGridToMarkdown emits no HTML or JSX tags", () => {
  const result = showcaseGridToMarkdown(
    {
      eyebrow: "Showcase",
      title: "Real sites",
      description: "Built with the template.",
      items: [
        {
          _key: "i1",
          siteName: "Volvo Chile",
          attributionName: "Roboto",
          url: "https://volvo.cl",
        },
      ],
    },
    {}
  );
  expect(result).not.toMatch(/<[A-Za-z]/);
});
