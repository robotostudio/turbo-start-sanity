/**
 * Unit tests for the shared markdown-helper utilities in ./markdown.ts.
 * These helpers are used by every per-block serializer, so correctness here
 * protects the entire pipeline.
 */

import {
  buttonsToMarkdown,
  cardHeading,
  eyebrowToMarkdown,
  headingToMarkdown,
  imageToMarkdown,
  joinSections,
  mdLink,
  type MarkdownImage,
  type MarkdownOptions,
} from "./markdown";

// ─── joinSections ────────────────────────────────────────────────────────────

test("joinSections returns empty string for an empty array", () => {
  expect(joinSections([])).toBe("");
});

test("joinSections filters null, undefined, and whitespace-only entries", () => {
  expect(joinSections([null, undefined, "  ", ""])).toBe("");
});

test("joinSections joins non-empty sections with a blank line", () => {
  expect(joinSections(["A", "B", "C"])).toBe("A\n\nB\n\nC");
});

test("joinSections returns a single non-empty section unchanged", () => {
  expect(joinSections(["only"])).toBe("only");
});

test("joinSections skips whitespace-only entries between real sections", () => {
  expect(joinSections(["First", "   ", "Second"])).toBe("First\n\nSecond");
});

// ─── eyebrowToMarkdown ───────────────────────────────────────────────────────

test("eyebrowToMarkdown returns empty for null/undefined/empty/whitespace", () => {
  expect(eyebrowToMarkdown(null)).toBe("");
  expect(eyebrowToMarkdown(undefined)).toBe("");
  expect(eyebrowToMarkdown("")).toBe("");
  expect(eyebrowToMarkdown("   ")).toBe("");
});

test("eyebrowToMarkdown wraps plain text in bold markers", () => {
  expect(eyebrowToMarkdown("New")).toBe("**New**");
});

test("eyebrowToMarkdown escapes # inside bold", () => {
  expect(eyebrowToMarkdown("Say #1")).toBe("**Say \\#1**");
});

test("eyebrowToMarkdown escapes underscores inside bold", () => {
  expect(eyebrowToMarkdown("_italic_")).toBe("**\\_italic\\_**");
});

test("eyebrowToMarkdown escapes square brackets inside bold", () => {
  expect(eyebrowToMarkdown("[link]")).toBe("**\\[link\\]**");
});

test("eyebrowToMarkdown escapes angle brackets (prevents HTML injection)", () => {
  expect(eyebrowToMarkdown("<script>")).toBe("**\\<script\\>**");
});

test("eyebrowToMarkdown escapes backtick and pipe", () => {
  expect(eyebrowToMarkdown("`code` | pipe")).toBe("**\\`code\\` \\| pipe**");
});

// ─── headingToMarkdown ───────────────────────────────────────────────────────

test("headingToMarkdown returns empty for null/undefined/whitespace", () => {
  expect(headingToMarkdown(null, 2)).toBe("");
  expect(headingToMarkdown(undefined, 2)).toBe("");
  expect(headingToMarkdown("  ", 2)).toBe("");
});

test("headingToMarkdown emits ## prefix for level 2", () => {
  expect(headingToMarkdown("About Us", 2)).toBe("## About Us");
});

test("headingToMarkdown emits ### prefix for level 3", () => {
  expect(headingToMarkdown("Card Title", 3)).toBe("### Card Title");
});

test("headingToMarkdown escapes underscores in title", () => {
  expect(headingToMarkdown("user_name field", 2)).toBe("## user\\_name field");
});

test("headingToMarkdown escapes square brackets in title", () => {
  expect(headingToMarkdown("[Tag] heading", 2)).toBe("## \\[Tag\\] heading");
});

test("headingToMarkdown escapes leading # so it is not a nested heading", () => {
  expect(headingToMarkdown("#hashtag", 2)).toBe("## \\#hashtag");
});

test("headingToMarkdown escapes asterisks in title", () => {
  expect(headingToMarkdown("*bold* text", 3)).toBe("### \\*bold\\* text");
});

test("headingToMarkdown escapes angle brackets (prevents HTML injection)", () => {
  expect(headingToMarkdown("<script>alert(1)</script>", 2)).toBe(
    "## \\<script\\>alert(1)\\</script\\>"
  );
});

// ─── buttonsToMarkdown ───────────────────────────────────────────────────────

test("buttonsToMarkdown returns empty for null and undefined", () => {
  expect(buttonsToMarkdown(null)).toBe("");
  expect(buttonsToMarkdown(undefined)).toBe("");
});

test("buttonsToMarkdown returns empty for an empty array", () => {
  expect(buttonsToMarkdown([])).toBe("");
});

test("buttonsToMarkdown renders a valid button as a Markdown link list item", () => {
  expect(buttonsToMarkdown([{ text: "Get started", href: "/start" }])).toBe(
    "- [Get started](/start)"
  );
});

test("buttonsToMarkdown renders plain text when href is '#'", () => {
  expect(buttonsToMarkdown([{ text: "Click me", href: "#" }])).toBe(
    "- Click me"
  );
});

test("buttonsToMarkdown renders plain text when href is absent", () => {
  expect(buttonsToMarkdown([{ text: "Anchor only" }])).toBe("- Anchor only");
});

test("buttonsToMarkdown uses href as label when text is empty and href is valid", () => {
  expect(buttonsToMarkdown([{ href: "/docs" }])).toBe("- [/docs](/docs)");
});

test("buttonsToMarkdown filters buttons with no text and no actionable href", () => {
  expect(buttonsToMarkdown([{ text: "", href: "#" }])).toBe("");
  expect(buttonsToMarkdown([{ text: "" }])).toBe("");
  expect(buttonsToMarkdown([{}])).toBe("");
});

test("buttonsToMarkdown escapes markdown chars in button text", () => {
  expect(buttonsToMarkdown([{ text: "user_name [docs]", href: "/path" }])).toBe(
    "- [user\\_name \\[docs\\]](/path)"
  );
});

test("buttonsToMarkdown wraps hrefs containing parentheses in angle brackets", () => {
  expect(buttonsToMarkdown([{ text: "See", href: "/docs/foo_(bar)" }])).toBe(
    "- [See](</docs/foo_(bar)>)"
  );
});

test("buttonsToMarkdown joins multiple buttons with a newline, not a blank line", () => {
  expect(
    buttonsToMarkdown([
      { text: "Primary", href: "/primary" },
      { text: "Secondary", href: "#" },
    ])
  ).toBe("- [Primary](/primary)\n- Secondary");
});

// ─── imageToMarkdown ─────────────────────────────────────────────────────────

const resolveImageUrl: MarkdownOptions["resolveImageUrl"] = (img) =>
  `https://cdn.example.com/${img.id}.webp`;

test("imageToMarkdown returns empty for null or undefined", () => {
  expect(imageToMarkdown(null, {})).toBe("");
  expect(imageToMarkdown(undefined, {})).toBe("");
});

test("imageToMarkdown returns empty when id, alt, and caption are all absent", () => {
  expect(imageToMarkdown({}, {})).toBe("");
  expect(imageToMarkdown({ id: null, alt: "", caption: "" }, {})).toBe("");
});

test("imageToMarkdown falls back to alt text when no resolver is provided", () => {
  const img: MarkdownImage = { id: "abc123", alt: "A photo" };
  expect(imageToMarkdown(img, {})).toBe("A photo");
});

test("imageToMarkdown falls back to caption when alt is empty and there is no resolver", () => {
  const img: MarkdownImage = { id: "abc123", alt: "", caption: "Nice view" };
  expect(imageToMarkdown(img, {})).toBe("Nice view");
});

test("imageToMarkdown emits image markdown when resolver returns a URL", () => {
  const img: MarkdownImage = { id: "abc123", alt: "A photo" };
  expect(imageToMarkdown(img, { resolveImageUrl })).toBe(
    "![A photo](https://cdn.example.com/abc123.webp)"
  );
});

test("imageToMarkdown escapes square brackets in alt text", () => {
  const img: MarkdownImage = { id: "abc123", alt: "A [diagram]" };
  expect(imageToMarkdown(img, { resolveImageUrl })).toBe(
    "![A \\[diagram\\]](https://cdn.example.com/abc123.webp)"
  );
});

test("imageToMarkdown escapes markdown chars in fallback alt text", () => {
  const img: MarkdownImage = { id: "abc123", alt: "user_name [tag]" };
  expect(imageToMarkdown(img, {})).toBe("user\\_name \\[tag\\]");
});

test("imageToMarkdown falls back to text when resolver returns null", () => {
  const img: MarkdownImage = { id: "abc123", alt: "Fallback" };
  expect(imageToMarkdown(img, { resolveImageUrl: () => null })).toBe(
    "Fallback"
  );
});

test("imageToMarkdown falls back to text when resolver returns undefined", () => {
  const img: MarkdownImage = { id: "abc123", alt: "Fallback" };
  expect(imageToMarkdown(img, { resolveImageUrl: () => undefined })).toBe(
    "Fallback"
  );
});

test("imageToMarkdown wraps image URLs with spaces in angle brackets", () => {
  const img: MarkdownImage = { id: "abc123", alt: "Photo" };
  expect(
    imageToMarkdown(img, {
      resolveImageUrl: () => "https://cdn.example.com/my file.webp",
    })
  ).toBe("![Photo](<https://cdn.example.com/my file.webp>)");
});

test("imageToMarkdown skips the resolver when id is null", () => {
  const img: MarkdownImage = { id: null, alt: "No id" };
  expect(imageToMarkdown(img, { resolveImageUrl })).toBe("No id");
});

test("imageToMarkdown appends caption as italic paragraph when caption differs from alt", () => {
  const img: MarkdownImage = {
    id: "abc123",
    alt: "A diagram",
    caption: "Figure 1",
  };
  expect(imageToMarkdown(img, { resolveImageUrl })).toBe(
    "![A diagram](https://cdn.example.com/abc123.webp)\n\n_Figure 1_"
  );
});

test("imageToMarkdown does not append caption when caption equals alt", () => {
  const img: MarkdownImage = {
    id: "abc123",
    alt: "Same text",
    caption: "Same text",
  };
  expect(imageToMarkdown(img, { resolveImageUrl })).toBe(
    "![Same text](https://cdn.example.com/abc123.webp)"
  );
});

test("imageToMarkdown escapes markdown chars in caption", () => {
  const img: MarkdownImage = {
    id: "abc123",
    alt: "Photo",
    caption: "_Caption_",
  };
  expect(imageToMarkdown(img, { resolveImageUrl })).toBe(
    "![Photo](https://cdn.example.com/abc123.webp)\n\n_\\_Caption\\__"
  );
});

// ─── mdLink ──────────────────────────────────────────────────────────────────

test("mdLink returns a Markdown link for a valid href", () => {
  expect(mdLink("Docs", "/docs")).toBe("[Docs](/docs)");
});

test("mdLink returns escaped plain text for '#' href", () => {
  expect(mdLink("Anchor", "#")).toBe("Anchor");
});

test("mdLink returns escaped plain text for null href", () => {
  expect(mdLink("Label", null)).toBe("Label");
});

test("mdLink returns escaped plain text for undefined href", () => {
  expect(mdLink("Label", undefined)).toBe("Label");
});

test("mdLink returns escaped plain text for empty-string href", () => {
  expect(mdLink("Label", "")).toBe("Label");
});

test("mdLink escapes markdown metacharacters in the label", () => {
  expect(mdLink("user_name [tag]", "/path")).toBe(
    "[user\\_name \\[tag\\]](/path)"
  );
});

test("mdLink wraps href with parentheses in angle brackets", () => {
  expect(mdLink("Link", "/wiki/foo_(bar)")).toBe("[Link](</wiki/foo_(bar)>)");
});

// ─── cardHeading ─────────────────────────────────────────────────────────────

test("cardHeading returns a linked h3 when title and href are both valid", () => {
  expect(cardHeading("Hero Block", "/hero")).toBe("### [Hero Block](/hero)");
});

test("cardHeading returns plain h3 (no link) when href is '#'", () => {
  expect(cardHeading("Hero Block", "#")).toBe("### Hero Block");
});

test("cardHeading returns plain h3 when href is null", () => {
  expect(cardHeading("Card", null)).toBe("### Card");
});

test("cardHeading returns plain h3 when href is undefined", () => {
  expect(cardHeading("Card", undefined)).toBe("### Card");
});

test("cardHeading escapes markdown chars in title", () => {
  expect(cardHeading("user_name [special]", "/path")).toBe(
    "### [user\\_name \\[special\\]](/path)"
  );
});

test("cardHeading uses the href as heading text when title is empty", () => {
  expect(cardHeading("", "/features")).toBe("### /features");
});

test("cardHeading returns empty string when title is empty and href is '#'", () => {
  expect(cardHeading("", "#")).toBe("");
});

test("cardHeading returns empty string when title is empty and href is null", () => {
  expect(cardHeading("", null)).toBe("");
  expect(cardHeading("", undefined)).toBe("");
});

test("cardHeading wraps paren-containing href in angle brackets when title is empty", () => {
  expect(cardHeading("", "/docs/foo_(bar)")).toBe("### </docs/foo_(bar)>");
});
