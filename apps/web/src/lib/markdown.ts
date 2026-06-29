import { urlFor } from "@workspace/sanity/client";
import type {
  QueryAllBlogDataForSearchResult,
  QueryBlogSlugPageDataResult,
} from "@workspace/sanity/types";
import {
  imageToMarkdown,
  type MarkdownBlock,
  pageBuilderToMarkdown,
} from "@workspace/sanity-blocks/internal/page-builder-to-markdown";
import {
  escapeMarkdown,
  type MarkdownImage,
  type MarkdownOptions,
  type PortableTextValue,
  portableTextToMarkdown,
} from "@workspace/sanity-blocks/internal/portable-text-to-markdown";

/** Resolves a Sanity image (by asset `_ref`) to a public CDN URL for Markdown. */
export const resolveImageUrl: NonNullable<
  MarkdownOptions["resolveImageUrl"]
> = (image) => {
  if (!image?.id) {
    return null;
  }
  try {
    // The image-url builder accepts an asset reference id (e.g. `image-…`).
    return urlFor(image.id).width(1600).url();
  } catch {
    return null;
  }
};

const markdownOptions: MarkdownOptions = { resolveImageUrl };

// Field shapes are derived from the generated query result types rather than
// hand-written, per the project's types strategy. The blog post result carries
// every field the serializers read, so it is the source for the document shape.
export type MarkdownDocument = Partial<
  Pick<
    NonNullable<QueryBlogSlugPageDataResult>,
    "title" | "description" | "image" | "richText" | "pageBuilder"
  >
>;

export type MarkdownBlogListItem = Partial<
  Pick<
    NonNullable<QueryAllBlogDataForSearchResult[number]>,
    "title" | "slug" | "orderRank"
  >
>;

function pageBuilderMarkdown(doc: MarkdownDocument): string {
  return pageBuilderToMarkdown(
    doc.pageBuilder as MarkdownBlock[] | null | undefined,
    markdownOptions
  );
}

function richTextMarkdown(richText: MarkdownDocument["richText"]): string {
  return portableTextToMarkdown(richText as PortableTextValue, markdownOptions);
}

function documentHeader(doc: MarkdownDocument): string {
  const title = doc.title?.trim();
  const description = doc.description?.trim();
  return [
    title ? `# ${escapeMarkdown(title)}` : "",
    description ? escapeMarkdown(description) : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function withTrailingNewline(sections: string[]): string {
  const body = sections.filter((section) => section.trim()).join("\n\n");
  return body ? `${body}\n` : "";
}

export function pageToMarkdown(doc: MarkdownDocument): string {
  return withTrailingNewline([documentHeader(doc), pageBuilderMarkdown(doc)]);
}

export function blogPostToMarkdown(doc: MarkdownDocument): string {
  const cover = imageToMarkdown(
    doc.image as MarkdownImage | null,
    markdownOptions
  );

  return withTrailingNewline([
    documentHeader(doc),
    cover,
    richTextMarkdown(doc.richText),
    pageBuilderMarkdown(doc),
  ]);
}

export function blogIndexToMarkdown(
  doc: MarkdownDocument,
  posts: MarkdownBlogListItem[]
): string {
  const list = [...posts]
    .sort((a, b) => (a.orderRank ?? "").localeCompare(b.orderRank ?? ""))
    .map((post) => {
      const title = post.title?.trim();
      const slug = post.slug?.trim();
      return title && slug ? `- [${escapeMarkdown(title)}](${slug})` : null;
    })
    .filter(Boolean)
    .join("\n");

  return withTrailingNewline([
    documentHeader(doc),
    pageBuilderMarkdown(doc),
    list ? `## Latest posts\n\n${list}` : "",
  ]);
}
