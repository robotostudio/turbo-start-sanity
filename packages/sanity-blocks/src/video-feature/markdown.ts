import {
  eyebrowToMarkdown,
  headingToMarkdown,
  joinSections,
  type MarkdownBlock,
  type MarkdownOptions,
  muxVideoToMarkdown,
} from "../internal/markdown";
import {
  escapeMarkdown,
  portableTextToMarkdown,
} from "../internal/portable-text-to-markdown";

export function videoFeatureToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  // `||`, not `??`: Sanity keeps "" for a cleared field, which would win.
  const still = muxVideoToMarkdown(
    block.video?.asset,
    block.caption || block.title
  );
  const caption = block.caption?.trim();

  return joinSections([
    eyebrowToMarkdown(block.eyebrow),
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.richText, options),
    still,
    // The still's alt already carries the caption; it needs its own line
    // only when there is no still.
    caption && !still ? `_${escapeMarkdown(caption)}_` : "",
  ]);
}
