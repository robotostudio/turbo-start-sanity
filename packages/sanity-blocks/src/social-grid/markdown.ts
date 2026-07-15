import {
  eyebrowToMarkdown,
  headingToMarkdown,
  joinSections,
  type MarkdownBlock,
  type MarkdownOptions,
  mdLink,
} from "../internal/markdown";
import { escapeMarkdown } from "../internal/portable-text-to-markdown";

export function socialGridToMarkdown(
  block: MarkdownBlock,
  _options: MarkdownOptions
): string {
  const socials = (block.socials ?? [])
    .map((social) => {
      const label = (social.label ?? social.platform ?? "").trim();
      if (!label) {
        return "";
      }
      return `- ${mdLink(label, social.href)}`;
    })
    .filter(Boolean);

  const subtitle = block.subtitle?.trim();

  return joinSections([
    eyebrowToMarkdown(block.eyebrow),
    headingToMarkdown(block.title, 2),
    subtitle ? escapeMarkdown(subtitle) : "",
    socials.length > 0 ? socials.join("\n") : "",
  ]);
}
