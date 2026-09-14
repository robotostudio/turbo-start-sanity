import {
  buttonsToMarkdown,
  headingToMarkdown,
  imageToMarkdown,
  joinSections,
  type MarkdownBlock,
  type MarkdownOptions,
} from "../internal/markdown";
import { escapeMarkdown } from "../internal/portable-text-to-markdown";

export function heroSplitToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  return joinSections([
    headingToMarkdown(block.title, 2),
    escapeMarkdown(block.subtitle?.trim() ?? ""),
    buttonsToMarkdown(block.buttons, options),
    imageToMarkdown(block.image, options),
  ]);
}
