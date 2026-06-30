import {
  type MarkdownBlock,
  type MarkdownOptions,
  buttonsToMarkdown,
  eyebrowToMarkdown,
  headingToMarkdown,
  imageToMarkdown,
  joinSections,
} from "../internal/markdown";
import { portableTextToMarkdown } from "../internal/portable-text-to-markdown";

export function heroToMarkdown(
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
