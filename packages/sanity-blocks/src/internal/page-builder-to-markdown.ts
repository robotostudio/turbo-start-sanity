/**
 * Page builder → Markdown serializer: the Markdown counterpart of
 * `renderBlockComponent`. Each block type maps to a function returning semantic
 * Markdown, so React components never leak as `<Component/>` tags. To support a
 * new block, add a `case` to `blockToMarkdown`; unknown types return "".
 */

import {
  escapeMarkdown,
  formatUrl,
  type MarkdownImage,
  type MarkdownOptions,
  type PortableTextValue,
  portableTextToMarkdown,
} from "./portable-text-to-markdown";

interface MarkdownButton {
  _key?: string | null;
  text?: string | null;
  href?: string | null;
}

interface MarkdownCard {
  _key?: string | null;
  title?: string | null;
  description?: string | null;
  href?: string | null;
  // Feature-card icon — intentionally dropped from Markdown (a test guards this).
  icon?: string | null;
  image?: MarkdownImage | null;
  richText?: PortableTextValue;
}

interface MarkdownFaq {
  _key?: string | null;
  _id?: string;
  title?: string | null;
  richText?: PortableTextValue;
}

interface MarkdownLink {
  title?: string | null;
  description?: string | null;
  href?: string | null;
}

export interface MarkdownBlock {
  _type?: string;
  _key?: string;
  title?: string | null;
  eyebrow?: string | null;
  badge?: string | null;
  subtitle?: string | null;
  richText?: PortableTextValue;
  subTitle?: PortableTextValue;
  helperText?: PortableTextValue;
  buttons?: MarkdownButton[] | null;
  cards?: MarkdownCard[] | null;
  faqs?: MarkdownFaq[] | null;
  link?: MarkdownLink | null;
  image?: MarkdownImage | null;
}

/** Joins defined, non-empty sections with a blank line between them. */
function joinSections(sections: Array<string | null | undefined>): string {
  return sections.filter((section) => section?.trim()).join("\n\n");
}

function eyebrowToMarkdown(eyebrow?: string | null): string {
  const text = eyebrow?.trim();
  return text ? `**${escapeMarkdown(text)}**` : "";
}

function headingToMarkdown(
  title: string | null | undefined,
  level: 2 | 3
): string {
  const text = title?.trim();
  return text ? `${"#".repeat(level)} ${escapeMarkdown(text)}` : "";
}

function buttonsToMarkdown(buttons?: MarkdownButton[] | null): string {
  if (!Array.isArray(buttons)) {
    return "";
  }

  return buttons
    .map((button) => {
      const text = (button.text ?? "").trim();
      const href = button.href;
      if (href && href !== "#") {
        return `- [${escapeMarkdown(text || href)}](${formatUrl(href)})`;
      }
      return text ? `- ${escapeMarkdown(text)}` : null;
    })
    .filter(Boolean)
    .join("\n");
}

export function imageToMarkdown(
  image: MarkdownImage | null | undefined,
  options: MarkdownOptions
): string {
  const alt = (image?.alt ?? "").trim();
  const caption = (image?.caption ?? "").trim();
  const url = image?.id ? options.resolveImageUrl?.(image) : undefined;
  // Mirror portable-text: image when a URL resolves, else caption/alt text.
  if (url) {
    return `![${escapeMarkdown(alt)}](${formatUrl(url)})`;
  }
  return escapeMarkdown(caption || alt);
}

/** A Markdown link, or plain escaped text when the href is missing or `#`. */
function mdLink(label: string, href: string | null | undefined): string {
  return href && href !== "#"
    ? `[${escapeMarkdown(label)}](${formatUrl(href)})`
    : escapeMarkdown(label);
}

function cardHeading(title: string, href: string | null | undefined): string {
  if (title) {
    return `### ${mdLink(title, href)}`;
  }
  return href && href !== "#" ? `### ${formatUrl(href)}` : "";
}

function heroToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  return joinSections([
    eyebrowToMarkdown(block.badge),
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.richText, options),
    imageToMarkdown(block.image, options),
    buttonsToMarkdown(block.buttons),
  ]);
}

function ctaToMarkdown(block: MarkdownBlock, options: MarkdownOptions): string {
  return joinSections([
    eyebrowToMarkdown(block.eyebrow),
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.richText, options),
    buttonsToMarkdown(block.buttons),
  ]);
}

function richTextBlockToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  return joinSections([
    eyebrowToMarkdown(block.eyebrow),
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.richText, options),
  ]);
}

function featureCardsToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  const cards = (block.cards ?? []).map((card) =>
    joinSections([
      headingToMarkdown(card.title, 3),
      portableTextToMarkdown(card.richText, options),
    ])
  );

  return joinSections([
    eyebrowToMarkdown(block.eyebrow),
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.richText, options),
    ...cards,
  ]);
}

function imageLinkCardsToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  const cards = (block.cards ?? [])
    .filter((card) => card.href)
    .map((card) => {
      const title = (card.title ?? "").trim();
      const description = (card.description ?? "").trim();
      return joinSections([
        cardHeading(title, card.href),
        description ? escapeMarkdown(description) : "",
        imageToMarkdown(card.image, options),
      ]);
    });

  return joinSections([
    eyebrowToMarkdown(block.eyebrow),
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.richText, options),
    ...cards,
  ]);
}

function faqAccordionToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  const faqs = (block.faqs ?? [])
    .filter((faq) => faq?.title)
    .map((faq) =>
      joinSections([
        headingToMarkdown(faq.title, 3),
        portableTextToMarkdown(faq.richText, options),
      ])
    );

  const link = block.link;
  const linkLabel = (link?.description || link?.title || "").trim();
  const linkMarkdown = linkLabel ? mdLink(linkLabel, link?.href) : "";

  const subtitle = (block.subtitle ?? "").trim();

  return joinSections([
    eyebrowToMarkdown(block.eyebrow),
    headingToMarkdown(block.title, 2),
    subtitle ? escapeMarkdown(subtitle) : "",
    ...faqs,
    linkMarkdown,
  ]);
}

function subscribeNewsletterToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  return joinSections([
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.subTitle, options),
    portableTextToMarkdown(block.helperText, options),
  ]);
}

function blockToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  switch (block?._type) {
    case "hero":
      return heroToMarkdown(block, options);
    case "cta":
      return ctaToMarkdown(block, options);
    case "richTextBlock":
      return richTextBlockToMarkdown(block, options);
    case "featureCardsIcon":
      return featureCardsToMarkdown(block, options);
    case "imageLinkCards":
      return imageLinkCardsToMarkdown(block, options);
    case "faqAccordion":
      return faqAccordionToMarkdown(block, options);
    case "subscribeNewsletter":
      return subscribeNewsletterToMarkdown(block, options);
    default:
      return "";
  }
}

export function pageBuilderToMarkdown(
  blocks: MarkdownBlock[] | null | undefined,
  options: MarkdownOptions = {}
): string {
  if (!Array.isArray(blocks)) {
    return "";
  }

  return blocks
    .map((block) => blockToMarkdown(block, options))
    .filter((markdown) => markdown.trim())
    .join("\n\n");
}
