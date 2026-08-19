import {
  buttonsToMarkdown,
  eyebrowToMarkdown,
  headingToMarkdown,
  imageToMarkdown,
  joinSections,
  type MarkdownBlock,
  type MarkdownOptions,
  type MarkdownVideoVariant,
  muxVideoToMarkdown,
} from "../internal/markdown";
import { portableTextToMarkdown } from "../internal/portable-text-to-markdown";

export function heroToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  // A whole variant at a time, matching `stillOf` on the rendered hero.
  // Mixing one theme's poster with the other's clip would put a different
  // image in `.md` than on the page.
  const stillOf = (variant?: MarkdownVideoVariant | null) =>
    variant?.poster
      ? imageToMarkdown(variant.poster, options)
      : muxVideoToMarkdown(variant?.mux, block.title);

  return joinSections([
    eyebrowToMarkdown(block.badge),
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.richText, options),
    stillOf(block.video?.light) || stillOf(block.video?.dark),
    buttonsToMarkdown(block.buttons, options),
  ]);
}
