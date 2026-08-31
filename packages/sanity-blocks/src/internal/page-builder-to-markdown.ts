/** Thin dispatcher: each block's Markdown serializer is co-located in its block
 * directory (add a `case` + `markdown.ts` for new blocks). Unknown types return "". */

import { ctaToMarkdown } from "../cta/markdown";
import { faqAccordionToMarkdown } from "../faq-accordion/markdown";
import { featureCardsIconToMarkdown } from "../feature-cards-icon/markdown";
import { heroToMarkdown } from "../hero/markdown";
import { logoCloudToMarkdown } from "../logo-cloud/markdown";
import { richTextBlockToMarkdown } from "../rich-text-block/markdown";
import { showcaseGridToMarkdown } from "../showcase-grid/markdown";
import { socialGridToMarkdown } from "../social-grid/markdown";
import { subscribeNewsletterToMarkdown } from "../subscribe-newsletter/markdown";
import { videoFeatureToMarkdown } from "../video-feature/markdown";
import type { MarkdownBlock, MarkdownOptions } from "./markdown";

export { imageToMarkdown } from "./markdown";
export type { MarkdownBlock };

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
    case "logoCloud":
      return logoCloudToMarkdown(block, options);
    case "socialGrid":
      return socialGridToMarkdown(block, options);
    case "showcaseGrid":
      return showcaseGridToMarkdown(block, options);
    case "faqAccordion":
      return faqAccordionToMarkdown(block, options);
    case "subscribeNewsletter":
      return subscribeNewsletterToMarkdown(block, options);
    case "videoFeature":
      return videoFeatureToMarkdown(block, options);
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
