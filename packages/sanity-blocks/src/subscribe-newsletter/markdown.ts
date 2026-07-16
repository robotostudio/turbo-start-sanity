import {
  eyebrowToMarkdown,
  headingToMarkdown,
  joinSections,
  type MarkdownBlock,
  type MarkdownOptions,
} from "../internal/markdown";
import { portableTextToMarkdown } from "../internal/portable-text-to-markdown";

export function subscribeNewsletterToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  const { testimonial } = block;
  const attribution = [testimonial?.authorName, testimonial?.authorRole]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");

  return joinSections([
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.subTitle, options),
    portableTextToMarkdown(block.helperText, options),
    eyebrowToMarkdown(testimonial?.eyebrow),
    portableTextToMarkdown(testimonial?.quote, options),
    attribution ? `— ${attribution}` : "",
  ]);
}
