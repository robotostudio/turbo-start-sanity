import { portableTextToMarkdown } from "./portable-text-serializers";

/**
 * Convert a single Sanity pageBuilder block to markdown.
 * Falls back to generic text extraction for unknown block types.
 * @param block - A single block from pageBuilder[]
 * @returns Markdown string for this block
 */
export function pageBuilderBlockToMarkdown(block: any): string {
  switch (block._type) {
    case "hero":
      return convertHeroBlock(block);

    case "cta":
      return convertCtaBlock(block);

    case "faqAccordion":
      return convertFaqAccordionBlock(block);

    case "featureCardsIcon":
      return convertFeatureCardsIconBlock(block);

    case "imageLinkCards":
      return convertImageLinkCardsBlock(block);

    case "subscribeNewsletter":
      return convertSubscribeNewsletterBlock(block);

    default:
      return extractTextContent(block);
  }
}

function convertHeroBlock(block: any): string {
  const parts: string[] = [];
  if (block.title) parts.push(`# ${block.title}`);
  if (block.subtitle && typeof block.subtitle === "string") {
    parts.push(block.subtitle);
  }
  if (block.richText) parts.push(portableTextToMarkdown(block.richText));
  return parts.join("\n\n") + "\n\n---\n";
}

function convertCtaBlock(block: any): string {
  const parts: string[] = [];
  if (block.title) parts.push(`## ${block.title}`);
  if (block.richText) parts.push(portableTextToMarkdown(block.richText));
  return parts.join("\n\n") + "\n\n---\n";
}

function convertFaqAccordionBlock(block: any): string {
  const parts: string[] = [];
  if (block.title) parts.push(`## ${block.title}`);
  if (block.subtitle && typeof block.subtitle === "string") {
    parts.push(block.subtitle);
  }
  const faqs = block.faqs || [];
  for (const faq of faqs) {
    if (faq.title) parts.push(`\n**${faq.title}**`);
    if (faq.richText) {
      parts.push(portableTextToMarkdown(faq.richText));
    }
  }
  return parts.join("\n") + "\n\n";
}

function convertFeatureCardsIconBlock(block: any): string {
  const parts: string[] = [];
  if (block.title) parts.push(`## ${block.title}`);
  if (block.richText) parts.push(portableTextToMarkdown(block.richText));
  const cards = block.cards || [];
  for (const card of cards) {
    const name = card.title || "";
    const desc = card.richText
      ? portableTextToMarkdown(card.richText)
      : typeof card.description === "string"
        ? card.description
        : "";
    if (name) parts.push(`- **${name}**${desc ? `: ${desc}` : ""}`);
  }
  return parts.join("\n\n") + "\n\n";
}

function convertImageLinkCardsBlock(block: any): string {
  const parts: string[] = [];
  if (block.title) parts.push(`## ${block.title}`);
  if (block.richText) parts.push(portableTextToMarkdown(block.richText));
  const cards = block.cards || [];
  for (const card of cards) {
    const name = card.title || "";
    const desc =
      typeof card.description === "string" ? card.description : "";
    const href = card.href || "";
    if (name && href) {
      parts.push(`- [**${name}**](${href})${desc ? `: ${desc}` : ""}`);
    } else if (name) {
      parts.push(`- **${name}**${desc ? `: ${desc}` : ""}`);
    }
  }
  return parts.join("\n\n") + "\n\n";
}

function convertSubscribeNewsletterBlock(block: any): string {
  const parts: string[] = [];
  if (block.title) parts.push(`## ${block.title}`);
  if (block.subTitle && Array.isArray(block.subTitle)) {
    parts.push(portableTextToMarkdown(block.subTitle));
  }
  return parts.join("\n\n") + "\n\n";
}

/**
 * Generic fallback: walk the block and pull out readable strings.
 * Skips image data, asset refs, and internal Sanity metadata keys.
 */
function extractTextContent(block: any): string {
  const text: string[] = [];
  const SKIP_FIELDS = new Set([
    "_key",
    "_type",
    "_id",
    "_ref",
    "lqip",
    "preview",
    "metadata",
    "asset",
    "hotspot",
    "crop",
    "image",
    "images",
    "logo",
    "icon",
    "alt",
    "caption",
    "palette",
    "dimensions",
  ]);

  function walk(obj: any, depth = 0): void {
    if (depth > 5) return;
    if (typeof obj === "string") {
      if (
        obj.length < 500 &&
        !obj.startsWith("data:image") &&
        !obj.startsWith("image-") &&
        !obj.startsWith("http") &&
        !obj.includes("sanity.io")
      ) {
        text.push(obj);
      }
    } else if (Array.isArray(obj)) {
      for (const item of obj) walk(item, depth + 1);
    } else if (obj && typeof obj === "object") {
      if (obj._type === "block" || Array.isArray(obj.children)) {
        const pt = portableTextToMarkdown([obj]);
        if (pt && pt.length < 500) text.push(pt);
      } else {
        for (const [key, value] of Object.entries(obj)) {
          if (!SKIP_FIELDS.has(key)) walk(value, depth + 1);
        }
      }
    }
  }

  walk(block);
  return Array.from(new Set(text))
    .filter((t) => t.trim().length > 0)
    .join("\n\n")
    .trim();
}
