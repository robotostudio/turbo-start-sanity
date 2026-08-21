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
import { mediaTypeOf } from "./media-type";

export function heroToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  // A whole variant at a time, matching `stillOf` on the rendered hero.
  // Mixing one theme's poster with the other's clip would put a different
  // image in `.md` than on the page. The Mux still is reachable only on the
  // Mux path, for the same reason the rendered hero gates it.
  const stillOf = (variant?: MarkdownVideoVariant | null) => {
    if (variant?.poster) {
      return imageToMarkdown(variant.poster, options);
    }
    return mediaTypeOf(variant) === "mux"
      ? muxVideoToMarkdown(variant?.mux, block.title)
      : "";
  };

  return joinSections([
    eyebrowToMarkdown(block.badge),
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.richText, options),
    stillOf(block.video?.light) || stillOf(block.video?.dark),
    buttonsToMarkdown(block.buttons, options),
  ]);
}
