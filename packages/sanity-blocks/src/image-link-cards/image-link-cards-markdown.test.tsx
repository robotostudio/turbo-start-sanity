import { imageLinkCardsToMarkdown } from "./markdown";

test("imageLinkCardsToMarkdown returns empty string for a fully empty block", () => {
  expect(imageLinkCardsToMarkdown({}, {})).toBe("");
});

test("imageLinkCardsToMarkdown renders eyebrow and section title", () => {
  const result = imageLinkCardsToMarkdown(
    { eyebrow: "Explore", title: "Components" },
    {}
  );
  expect(result).toBe("**Explore**\n\n## Components");
});

test("imageLinkCardsToMarkdown renders linked card headings", () => {
  const result = imageLinkCardsToMarkdown(
    { cards: [{ _key: "c1", title: "Hero", href: "/hero" }] },
    {}
  );
  expect(result).toContain("### [Hero](/hero)");
});

test("imageLinkCardsToMarkdown filters cards without an href", () => {
  const result = imageLinkCardsToMarkdown(
    {
      cards: [
        { _key: "c1", title: "No link" },
        { _key: "c2", title: "Has link", href: "/page" },
      ],
    },
    {}
  );
  expect(result).not.toContain("No link");
  expect(result).toContain("### [Has link](/page)");
});

test("imageLinkCardsToMarkdown includes card description", () => {
  const result = imageLinkCardsToMarkdown(
    {
      cards: [
        {
          _key: "c1",
          title: "Card",
          href: "/card",
          description: "A reusable section.",
        },
      ],
    },
    {}
  );
  expect(result).toContain("A reusable section.");
});

test("imageLinkCardsToMarkdown escapes markdown chars in description", () => {
  const result = imageLinkCardsToMarkdown(
    {
      cards: [
        {
          _key: "c1",
          title: "Card",
          href: "/card",
          description: "Supports _italic_ and [links].",
        },
      ],
    },
    {}
  );
  expect(result).toContain("Supports \\_italic\\_ and \\[links\\].");
});

test("imageLinkCardsToMarkdown renders card image when a resolver is provided", () => {
  const result = imageLinkCardsToMarkdown(
    {
      cards: [
        {
          _key: "c1",
          title: "Card",
          href: "/card",
          image: { id: "img1", alt: "Preview" },
        },
      ],
    },
    { resolveImageUrl: (img) => `https://cdn.example.com/${img.id}.webp` }
  );
  expect(result).toContain("![Preview](https://cdn.example.com/img1.webp)");
});

test("imageLinkCardsToMarkdown falls back to alt text for card image when no resolver", () => {
  const result = imageLinkCardsToMarkdown(
    {
      cards: [
        {
          _key: "c1",
          title: "Card",
          href: "/card",
          image: { id: "img1", alt: "Fallback" },
        },
      ],
    },
    {}
  );
  expect(result).toContain("Fallback");
  expect(result).not.toContain("![");
});

test("imageLinkCardsToMarkdown drops '#' placeholder-href cards entirely", () => {
  // href="#" is now filtered out (consistent with how buttons treat "#").
  const result = imageLinkCardsToMarkdown(
    { cards: [{ _key: "c1", title: "Hash card", href: "#" }] },
    {}
  );
  expect(result).toBe("");
});

test("imageLinkCardsToMarkdown emits no HTML or JSX tags", () => {
  const result = imageLinkCardsToMarkdown(
    { title: "T", cards: [{ _key: "c1", title: "Card", href: "/card" }] },
    {}
  );
  expect(result).not.toMatch(/<[A-Za-z]/);
});
