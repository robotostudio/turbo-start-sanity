import {
  eyebrowToMarkdown,
  imageToMarkdown,
  joinSections,
  type MarkdownBlock,
  type MarkdownOptions,
} from "../internal/markdown";
import { formatUrl } from "../internal/portable-text-to-markdown";

export function logoCloudToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  const logos = (block.logos ?? [])
    .map((logo) => {
      const media = imageToMarkdown(logo.image, options);
      if (!media) {
        return "";
      }
      const href = logo.href;
      const item =
        href && href !== "#" ? `[${media}](${formatUrl(href)})` : media;
      return `- ${item}`;
    })
    .filter(Boolean);

  return joinSections([
    eyebrowToMarkdown(block.title),
    logos.length > 0 ? logos.join("\n") : "",
  ]);
}
