import {
  buttonsToMarkdown,
  eyebrowToMarkdown,
  headingToMarkdown,
  imageToMarkdown,
  joinSections,
  type MarkdownBlock,
  type MarkdownOptions,
} from "../internal/markdown";
import { portableTextToMarkdown } from "../internal/portable-text-to-markdown";

export function heroToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  // The hero background is a video whose poster is the only still image; fall
  // back to the dark variant's poster, mirroring the web component.
  const poster = block.video?.light?.poster ?? block.video?.dark?.poster;
  return joinSections([
    eyebrowToMarkdown(block.badge),
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.richText, options),
    imageToMarkdown(poster, options),
    buttonsToMarkdown(block.buttons, options),
  ]);
}
