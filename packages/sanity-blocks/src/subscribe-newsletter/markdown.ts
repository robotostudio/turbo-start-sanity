import {
  type MarkdownBlock,
  type MarkdownOptions,
  headingToMarkdown,
  joinSections,
} from "../internal/markdown";
import { portableTextToMarkdown } from "../internal/portable-text-to-markdown";

export function subscribeNewsletterToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  return joinSections([
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.subTitle, options),
    portableTextToMarkdown(block.helperText, options),
  ]);
}
