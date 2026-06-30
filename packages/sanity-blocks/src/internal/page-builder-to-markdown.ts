/**
 * Page builder → Markdown serializer: thin dispatcher. Each block type's
 * serializer lives co-located in its block directory. To support a new block,
 * add a `case` here and create a `markdown.ts` in that block's directory.
 * Unknown types return "".
 */

import { ctaToMarkdown } from "../cta/markdown";
import { faqAccordionToMarkdown } from "../faq-accordion/markdown";
import { featureCardsIconToMarkdown } from "../feature-cards-icon/markdown";
import { heroToMarkdown } from "../hero/markdown";
import { imageLinkCardsToMarkdown } from "../image-link-cards/markdown";
import {
  type MarkdownBlock,
  type MarkdownOptions,
  imageToMarkdown,
} from "./markdown";
import { richTextBlockToMarkdown } from "../rich-text-block/markdown";
import { subscribeNewsletterToMarkdown } from "../subscribe-newsletter/markdown";

export type { MarkdownBlock };
export { imageToMarkdown };

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
      return featureCardsIconToMarkdown(block, options);
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
