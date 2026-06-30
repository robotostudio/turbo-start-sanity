import {
  type MarkdownBlock,
  type MarkdownOptions,
  cardHeading,
  eyebrowToMarkdown,
  headingToMarkdown,
  imageToMarkdown,
  joinSections,
} from "../internal/markdown";
import {
  escapeMarkdown,
  portableTextToMarkdown,
} from "../internal/portable-text-to-markdown";

export function imageLinkCardsToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  const cards = (block.cards ?? []).map((card) => {
    const title = (card.title ?? "").trim();
    const description = (card.description ?? "").trim();
    return joinSections([
      cardHeading(title, card.href),
      description ? escapeMarkdown(description) : "",
      imageToMarkdown(card.image, options),
    ]);
  });

  return joinSections([
    eyebrowToMarkdown(block.eyebrow),
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.richText, options),
    ...cards,
  ]);
}
