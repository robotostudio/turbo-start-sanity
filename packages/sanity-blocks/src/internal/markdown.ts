/**
 * Shared helpers and types for page-builder Markdown serialization.
 * Block-level serializers (co-located in each block's directory) import from
 * here to stay DRY and avoid circular dependencies with the dispatcher.
 */

import {
  escapeMarkdown,
  formatUrl,
  type MarkdownImage,
  type MarkdownOptions,
  type PortableTextValue,
} from "./portable-text-to-markdown";

export type { MarkdownImage, MarkdownOptions, PortableTextValue };

export interface MarkdownButton {
  _key?: string | null;
  text?: string | null;
  href?: string | null;
}

export interface MarkdownCard {
  _key?: string | null;
  title?: string | null;
  description?: string | null;
  href?: string | null;
  // Feature-card icon — intentionally dropped from Markdown (a test guards this).
  icon?: string | null;
  image?: MarkdownImage | null;
  richText?: PortableTextValue;
}

export interface MarkdownFaq {
  _key?: string | null;
  _id?: string;
  title?: string | null;
  richText?: PortableTextValue;
}

export interface MarkdownLink {
  title?: string | null;
  description?: string | null;
  href?: string | null;
}

export interface MarkdownBlock {
  _type?: string;
  _key?: string;
  title?: string | null;
  eyebrow?: string | null;
  badge?: string | null;
  subtitle?: string | null;
  richText?: PortableTextValue;
  subTitle?: PortableTextValue;
  helperText?: PortableTextValue;
  buttons?: MarkdownButton[] | null;
  cards?: MarkdownCard[] | null;
  faqs?: MarkdownFaq[] | null;
  link?: MarkdownLink | null;
  image?: MarkdownImage | null;
}

/** Joins defined, non-empty sections with a blank line between them. */
export function joinSections(
  sections: Array<string | null | undefined>
): string {
  return sections.filter((section) => section?.trim()).join("\n\n");
}

export function eyebrowToMarkdown(eyebrow?: string | null): string {
  const text = eyebrow?.trim().replace(/\s+/g, " ");
  return text ? `**${escapeMarkdown(text)}**` : "";
}

export function headingToMarkdown(
  title: string | null | undefined,
  level: 2 | 3
): string {
  const text = title?.trim().replace(/\s+/g, " ");
  return text ? `${"#".repeat(level)} ${escapeMarkdown(text)}` : "";
}

export function buttonsToMarkdown(buttons?: MarkdownButton[] | null): string {
  if (!Array.isArray(buttons)) {
    return "";
  }

  return buttons
    .map((button) => {
      const text = (button.text ?? "").trim();
      const href = button.href;
      if (href && href !== "#") {
        return `- [${escapeMarkdown(text || href)}](${formatUrl(href)})`;
      }
      return text ? `- ${escapeMarkdown(text)}` : null;
    })
    .filter(Boolean)
    .join("\n");
}

export function imageToMarkdown(
  image: MarkdownImage | null | undefined,
  options: MarkdownOptions
): string {
  const alt = (image?.alt ?? "").trim();
  const caption = (image?.caption ?? "").trim();
  const url = image?.id ? options.resolveImageUrl?.(image) : undefined;
  // Mirror portable-text: image when a URL resolves, else caption/alt text.
  if (url) {
    const img = `![${escapeMarkdown(alt)}](${formatUrl(url)})`;
    return caption && caption !== alt
      ? `${img}\n\n_${escapeMarkdown(caption)}_`
      : img;
  }
  return escapeMarkdown(caption || alt);
}

/** A Markdown link, or plain escaped text when the href is missing or `#`. */
export function mdLink(label: string, href: string | null | undefined): string {
  return href && href !== "#"
    ? `[${escapeMarkdown(label)}](${formatUrl(href)})`
    : escapeMarkdown(label);
}

export function cardHeading(
  title: string,
  href: string | null | undefined
): string {
  if (title) {
    return `### ${mdLink(title, href)}`;
  }
  return href && href !== "#" ? `### ${formatUrl(href)}` : "";
}
