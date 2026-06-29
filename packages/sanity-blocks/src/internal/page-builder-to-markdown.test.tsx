import {
  type MarkdownBlock,
  pageBuilderToMarkdown,
} from "@workspace/sanity-blocks/internal/page-builder-to-markdown";

const para = (text: string) => [
  { _type: "block", style: "normal", children: [{ _type: "span", text }] },
];

test("returns empty string for missing input", () => {
  expect(pageBuilderToMarkdown(undefined)).toBe("");
  expect(pageBuilderToMarkdown(null)).toBe("");
  expect(pageBuilderToMarkdown([])).toBe("");
});

test("serializes an FAQ block as semantic markdown, not a component tag", () => {
  const md = pageBuilderToMarkdown([
    {
      _type: "faqAccordion",
      title: "Questions",
      eyebrow: "FAQ",
      subtitle: "Helpful answers",
      faqs: [
        { _id: "1", title: "What is this?", richText: para("An answer.") },
        { _id: "2", title: "" }, // skipped — no title
      ],
      link: { title: "More", description: "See all", href: "/faq" },
    },
  ]);

  expect(md).toContain("**FAQ**");
  expect(md).toContain("## Questions");
  expect(md).toContain("Helpful answers");
  expect(md).toContain("### What is this?");
  expect(md).toContain("An answer.");
  expect(md).toContain("[See all](/faq)");
  // The acceptance criterion: no raw <FAQComponent/> style tags.
  expect(md).not.toMatch(/<[A-Za-z]/);
});

test("serializes hero with buttons as markdown links", () => {
  const md = pageBuilderToMarkdown([
    {
      _type: "hero",
      badge: "New",
      title: "Welcome",
      richText: para("Intro copy."),
      buttons: [
        { _key: "b1", text: "Get started", href: "/start" },
        { _key: "b2", text: "Broken", href: "#" },
      ],
    },
  ]);

  expect(md).toContain("## Welcome");
  expect(md).toContain("Intro copy.");
  expect(md).toContain("- [Get started](/start)");
  expect(md).toContain("- Broken");
});

test("serializes feature cards as nested headings", () => {
  const md = pageBuilderToMarkdown([
    {
      _type: "featureCardsIcon",
      title: "Features",
      cards: [
        {
          _key: "c1",
          title: "Fast",
          richText: para("Very fast."),
          icon: "bolt",
        },
      ],
    },
  ]);

  expect(md).toContain("## Features");
  expect(md).toContain("### Fast");
  expect(md).toContain("Very fast.");
  expect(md).not.toContain("bolt");
});

test("serializes subscribe newsletter without form markup", () => {
  const md = pageBuilderToMarkdown([
    {
      _type: "subscribeNewsletter",
      title: "Stay in the loop",
      subTitle: para("Subscribe for updates."),
      helperText: para("No spam."),
    },
  ]);

  expect(md).toContain("## Stay in the loop");
  expect(md).toContain("Subscribe for updates.");
  expect(md).toContain("No spam.");
  expect(md).not.toMatch(/<(form|input|button)/i);
});

test("unknown blocks contribute nothing", () => {
  const md = pageBuilderToMarkdown([
    { _type: "someFutureBlock", title: "Ignore me" } as MarkdownBlock,
    { _type: "richTextBlock", title: "Kept", richText: para("Body.") },
  ]);

  expect(md).not.toContain("Ignore me");
  expect(md).toContain("## Kept");
  expect(md).toContain("Body.");
});

test("separates blocks with a blank line", () => {
  const md = pageBuilderToMarkdown([
    { _type: "richTextBlock", title: "One" },
    { _type: "richTextBlock", title: "Two" },
  ]);

  expect(md).toBe("## One\n\n## Two");
});
