import {
  type MarkdownBlock,
  type MarkdownOptions,
  eyebrowToMarkdown,
  headingToMarkdown,
  joinSections,
  mdLink,
} from "../internal/markdown";
import {
  escapeMarkdown,
  portableTextToMarkdown,
} from "../internal/portable-text-to-markdown";

export function faqAccordionToMarkdown(
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
