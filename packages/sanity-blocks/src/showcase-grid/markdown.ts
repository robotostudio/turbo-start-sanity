import {
  headingToMarkdown,
  joinSections,
  type MarkdownBlock,
  type MarkdownOptions,
  mdLink,
} from "../internal/markdown";
import { escapeMarkdown } from "../internal/portable-text-to-markdown";

export function showcaseGridToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  const items = (block.items ?? [])
    .map((item) => {
      const name = (item.siteName ?? "").trim();
      if (!name) {
        return "";
      }
      const link = mdLink(name, item.url, options);
      const category = (item.category ?? "").trim();
      return category ? `- ${link} — ${escapeMarkdown(category)}` : `- ${link}`;
    })
    .filter(Boolean);

  const description = block.description?.trim();

  return joinSections([
    headingToMarkdown(block.title, 2),
    description ? escapeMarkdown(description) : "",
    items.length > 0 ? items.join("\n") : "",
  ]);
}
