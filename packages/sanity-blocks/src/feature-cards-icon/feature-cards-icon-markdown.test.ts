import { featureCardsIconToMarkdown } from "./markdown";

const para = (text: string) => [
  {
    _type: "block",
    style: "normal",
    children: [{ _type: "span", text }],
  },
];

test("featureCardsIconToMarkdown returns empty string for a fully empty block", () => {
  expect(featureCardsIconToMarkdown({}, {})).toBe("");
});

test("featureCardsIconToMarkdown renders a section title alone", () => {
  expect(featureCardsIconToMarkdown({ title: "Features" }, {})).toBe(
    "## Features"
  );
});

test("featureCardsIconToMarkdown renders eyebrow above the title", () => {
  const result = featureCardsIconToMarkdown(
    { eyebrow: "Why us", title: "Features" },
    {}
  );
  expect(result).toBe("**Why us**\n\n## Features");
});

test("featureCardsIconToMarkdown renders each card as an h3 section", () => {
  const result = featureCardsIconToMarkdown(
    {
      title: "Features",
      cards: [
        { _key: "c1", title: "Fast", richText: para("Very fast.") },
        { _key: "c2", title: "Secure", richText: para("Very secure.") },
      ],
    },
    {}
  );
  expect(result).toContain("### Fast");
  expect(result).toContain("Very fast.");
  expect(result).toContain("### Secure");
  expect(result).toContain("Very secure.");
});

test("featureCardsIconToMarkdown drops the icon field from output", () => {
  const result = featureCardsIconToMarkdown(
    {
      cards: [{ _key: "c1", title: "Card", icon: "bolt" }],
    },
    {}
  );
  expect(result).not.toContain("bolt");
});

test("featureCardsIconToMarkdown still renders richText for a card with no title", () => {
  const result = featureCardsIconToMarkdown(
    {
      cards: [{ _key: "c1", richText: para("Body without heading.") }],
    },
    {}
  );
  expect(result).toContain("Body without heading.");
});

test("featureCardsIconToMarkdown handles null cards without throwing", () => {
  expect(() =>
    featureCardsIconToMarkdown({ title: "T", cards: null }, {})
  ).not.toThrow();
});

test("featureCardsIconToMarkdown escapes markdown chars in card title", () => {
  const result = featureCardsIconToMarkdown(
    {
      cards: [{ _key: "c1", title: "user_name [feature]" }],
    },
    {}
  );
  expect(result).toContain("### user\\_name \\[feature\\]");
});

test("featureCardsIconToMarkdown emits no HTML or JSX tags", () => {
  const result = featureCardsIconToMarkdown(
    {
      title: "T",
      cards: [{ _key: "c1", title: "Card", richText: para("Body.") }],
    },
    {}
  );
  expect(result).not.toMatch(/<[A-Za-z]/);
});
