import { pageBuilderBlockToMarkdown } from "./pagebuilder-serializers";
import { portableTextToMarkdown } from "./portable-text-serializers";
import { normalizeMarkdownUrls } from "./url-normalizer";

/**
 * Convert a Sanity document to a clean markdown string.
 * Handles title, description, metadata, PortableText body (richText),
 * and pageBuilder blocks.
 * @param documentData - Object with `type` (Sanity _type) and `data` (full document)
 * @returns Clean markdown string with normalized absolute URLs
 */
export function formatDocumentAsMarkdown(documentData: {
  type: string;
  data: any;
}): string {
  const { data, type } = documentData;
  const parts: string[] = [];

  // 1. Title
  if (data.title || data.name) {
    parts.push(`# ${data.title || data.name}\n`);
  }

  // 2. Description as blockquote
  const desc =
    data.seoDescription || data.description || data.excerpt || data.summary;
  if (desc && typeof desc === "string") {
    parts.push(`> ${desc}\n`);
  }

  // 3. Metadata block
  const meta: string[] = [];

  const authorData = data.authors?.[0] || data.author;
  if (authorData) {
    const authorName =
      typeof authorData === "string" ? authorData : authorData.name;
    if (authorName) meta.push(`**Author:** ${authorName}`);
  }

  const pubDate =
    data.publishedAt || data.date || data.pubDateTime || data._createdAt;
  if (pubDate) {
    const pubDateObj = new Date(pubDate);
    if (!Number.isNaN(pubDateObj.getTime())) {
      const date = pubDateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      meta.push(`**Published:** ${date}`);
    }
  }

  const upDate = data._updatedAt || data.updatedAt;
  if (upDate && pubDate) {
    const upDateObj = new Date(upDate);
    const pubDateObj = new Date(pubDate);
    if (!Number.isNaN(upDateObj.getTime()) && !Number.isNaN(pubDateObj.getTime())) {
      const updatedStr = upDateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const pubStr = pubDateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      if (updatedStr !== pubStr) meta.push(`**Updated:** ${updatedStr}`);
    }
  }

  if (data.topics && Array.isArray(data.topics)) {
    const topicNames = data.topics
      .map(
        (t: any) => t?.title || t?.name || (typeof t === "string" ? t : null),
      )
      .filter(
        (name: unknown): name is string =>
          typeof name === "string" && name.length > 0,
      );
    if (topicNames.length > 0)
      meta.push(`**Topics:** ${topicNames.join(", ")}`);
  }

  if (meta.length > 0) {
    parts.push(meta.join("  \n") + "\n");
  }

  parts.push("---\n");

  // 4. Main rich text body (PortableText)
  const body = data.richText || data.body || data.content;
  if (body && Array.isArray(body)) {
    parts.push(portableTextToMarkdown(body));
    parts.push("\n");
  }

  // 5. PageBuilder blocks
  if (data.pageBuilder && Array.isArray(data.pageBuilder)) {
    for (const block of data.pageBuilder) {
      const blockMarkdown = pageBuilderBlockToMarkdown(block);
      if (blockMarkdown.trim()) {
        parts.push(`${blockMarkdown}\n`);
      }
    }
  }

  // 6. Blog listing (for blogIndex pages)
  if (data.blogs && Array.isArray(data.blogs) && data.blogs.length > 0) {
    parts.push("## Blog Posts\n");
    for (const blog of data.blogs) {
      const title = blog.title || "Untitled";
      const slug = blog.slug || "";
      const desc = blog.description || "";
      const date = blog.publishedAt
        ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "";
      const dateSuffix = date ? ` (${date})` : "";
      if (slug) {
        parts.push(
          `- [${title}](${slug})${dateSuffix}${desc ? ` — ${desc}` : ""}`,
        );
      }
    }
    parts.push("");
  }

  const markdown = parts
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return normalizeMarkdownUrls(markdown);
}
