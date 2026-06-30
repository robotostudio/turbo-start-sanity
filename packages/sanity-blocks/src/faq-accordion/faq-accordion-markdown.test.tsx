import { faqAccordionToMarkdown } from "./markdown";

const para = (text: string) => [
  {
    _type: "block",
    style: "normal",
    children: [{ _type: "span", text }],
  },
];

test("faqAccordionToMarkdown returns empty string for a fully empty block", () => {
  expect(faqAccordionToMarkdown({}, {})).toBe("");
});

test("faqAccordionToMarkdown renders eyebrow and title with no faqs", () => {
  const result = faqAccordionToMarkdown({ eyebrow: "Help", title: "FAQ" }, {});
  expect(result).toBe("**Help**\n\n## FAQ");
});

test("faqAccordionToMarkdown renders subtitle below title", () => {
  const result = faqAccordionToMarkdown(
    { title: "FAQ", subtitle: "Your questions answered" },
    {}
  );
  expect(result).toContain("Your questions answered");
});

test("faqAccordionToMarkdown escapes markdown chars in subtitle", () => {
  const result = faqAccordionToMarkdown(
    { title: "FAQ", subtitle: "Ask [us] anything_here | now" },
    {}
  );
  expect(result).toContain("Ask \\[us\\] anything\\_here \\| now");
});

test("faqAccordionToMarkdown renders each faq as h3 followed by its answer", () => {
  const result = faqAccordionToMarkdown(
    {
      title: "FAQ",
      faqs: [{ title: "What?", richText: para("An answer.") }],
    },
    {}
  );
  expect(result).toContain("### What?");
  expect(result).toContain("An answer.");
});

test("faqAccordionToMarkdown skips faqs that have no title", () => {
  const result = faqAccordionToMarkdown(
    {
      title: "FAQ",
      faqs: [
        { title: "", richText: para("Orphan body") },
        { richText: para("Also orphan") },
        { title: "Valid Q", richText: para("Yes.") },
      ],
    },
    {}
  );
  expect(result).not.toContain("Orphan body");
  expect(result).not.toContain("Also orphan");
  expect(result).toContain("### Valid Q");
});

test("faqAccordionToMarkdown handles null faqs without throwing", () => {
  expect(() =>
    faqAccordionToMarkdown({ title: "FAQ", faqs: null }, {})
  ).not.toThrow();
});

test("faqAccordionToMarkdown prefers link description over link title", () => {
  const result = faqAccordionToMarkdown(
    {
      title: "FAQ",
      faqs: [{ title: "Q", richText: para("A") }],
      link: { title: "MoreX", description: "See all FAQs", href: "/faq" },
    },
    {}
  );
  expect(result).toContain("[See all FAQs](/faq)");
  expect(result).not.toContain("MoreX");
});

test("faqAccordionToMarkdown uses link title when description is absent", () => {
  const result = faqAccordionToMarkdown(
    {
      title: "FAQ",
      faqs: [{ title: "Q", richText: para("A") }],
      link: { title: "More", href: "/faq" },
    },
    {}
  );
  expect(result).toContain("[More](/faq)");
});

test("faqAccordionToMarkdown renders link as plain text when href is '#'", () => {
  const result = faqAccordionToMarkdown(
    {
      title: "FAQ",
      faqs: [{ title: "Q", richText: para("A") }],
      link: { title: "Label", href: "#" },
    },
    {}
  );
  expect(result).toContain("Label");
  expect(result).not.toContain("(#)");
});

test("faqAccordionToMarkdown emits no HTML or JSX tags", () => {
  const result = faqAccordionToMarkdown(
    {
      title: "FAQ",
      faqs: [{ title: "Q?", richText: para("Answer text.") }],
    },
    {}
  );
  expect(result).not.toMatch(/<[A-Za-z]/);
});
