/**
 * Serializes `richText` portable-text arrays to Markdown. Pure (no React), so
 * blocks degrade to semantic Markdown instead of leaking JSX like
 * `<FAQComponent/>` when content is requested as Markdown.
 *
 * Delegates to the official `@portabletext/markdown` library with custom
 * renderers wired in for:
 *   - `customLink` annotation marks (Sanity schema convention)
 *   - Sanity image blocks (`{id, alt, caption}` via `resolveImageUrl`)
 *   - Inline code spans (CommonMark-compliant backtick fencing)
 *   - Underline marks (plain text — no `<u>` HTML leakage)
 *   - Unknown block types (silenced to `""`)
 */

import {
  DefaultNormalRenderer,
  portableTextToMarkdown as officialPortableTextToMarkdown,
} from "@portabletext/markdown";

export interface PortableTextSpan {
  _type?: string;
  _key?: string | null;
  text?: string | null;
  marks?: string[] | null;
}

export interface PortableTextMarkDef {
  _key?: string | null;
  _type?: string | null;
  href?: string | null;
}

export interface PortableTextNode {
  _type?: string;
  _key?: string | null;
  style?: string | null;
  listItem?: string | null;
  level?: number | null;
  children?: PortableTextSpan[] | null;
  markDefs?: PortableTextMarkDef[] | null;
  // Inline image fields (projected by the shared image GROQ fragment).
  id?: string | null;
  alt?: string | null;
  caption?: string | null;
}

export interface MarkdownImage {
  id?: string | null;
  alt?: string | null;
  caption?: string | null;
}

export interface MarkdownOptions {
  /**
   * Resolves a Sanity image to a public URL. When omitted, images degrade to
   * their alt/caption text rather than emitting broken `![]()` markup.
   */
  resolveImageUrl?: (image: MarkdownImage) => string | null | undefined;
}

export type PortableTextValue = PortableTextNode[] | null | undefined;

// Format a URL for a Markdown link/image target. Spaces or parens would close
// the `(...)` early, so wrap those in CommonMark's angle-bracket form.
export function formatUrl(href: string | null | undefined): string {
  const url = (href ?? "").trim();
  if (!url) {
    return "";
  }
  return /[\s()]/.test(url) ? `<${url}>` : url;
}

// Escape inline Markdown metacharacters so literal author text (e.g.
// `user_name_field`) isn't reinterpreted as italics/bold/links.
// Used by block-level serializers for plain-string fields (title, eyebrow, etc.).
export function escapeMarkdown(text: string): string {
  return text.replace(/([\\`*_[\]<>~|#])/g, String.raw`\$1`);
}

// Inline code span: fence with one more backtick than the longest inner run,
// padded when the content borders a backtick (CommonMark §6.1).
function wrapInlineCode(text: string): string {
  const longestRun = (text.match(/`+/g) ?? []).reduce(
    (max, run) => Math.max(max, run.length),
    0
  );
  const fence = "`".repeat(longestRun + 1);
  const body = text.startsWith("`") || text.endsWith("`") ? ` ${text} ` : text;
  return `${fence}${body}${fence}`;
}

type AnyBlock = { _type: string; [key: string]: unknown };

/**
 * Converts a portable-text array to a Markdown string.
 *
 * Consecutive list items are kept together (single newline); everything else
 * is separated by a blank line (handled by the official library's block-spacing
 * renderer). Trailing blank lines from empty blocks are trimmed.
 */
export function portableTextToMarkdown(
  blocks: PortableTextValue,
  options: MarkdownOptions = {}
): string {
  if (!Array.isArray(blocks)) {
    return "";
  }

  return officialPortableTextToMarkdown(blocks as AnyBlock[], {
    // Escape block-leading Markdown markers in plain paragraphs so a normal
    // paragraph whose text starts with `- x`, `1. x`, `> x`, `# x`, or `---`
    // is emitted verbatim instead of being re-parsed as a list / blockquote /
    // heading / thematic break. The official lib's DefaultNormalRenderer just
    // returns `children`, so we wrap it and apply the escaping after.
    // List items produced by real `listItem` blocks are NOT touched here —
    // they go through the lib's list renderer, not through `block.normal`.
    block: {
      normal: (opts) =>
        DefaultNormalRenderer(opts)
          .replace(/^([-+*]) /gm, String.raw`\$1 `)
          .replace(/^(\d+)([.)]) /gm, String.raw`$1\$2 `)
          .replace(/^(>) /gm, String.raw`\$1 `)
          .replace(/^(#{1,6}) /gm, String.raw`\$1 `)
          .replace(/^([-*_]{3,})$/gm, String.raw`\$1`),
    },
    marks: {
      // Sanity schema convention: links use `customLink`, not the standard `link`.
      customLink: ({ value, children }) => {
        const href = value?.href as string | null | undefined;
        if (!href || href === "#") {
          return children;
        }
        return `[${children}](${formatUrl(href)})`;
      },
      // Use CommonMark-compliant fencing (handles embedded backticks).
      code: ({ children }) => wrapInlineCode(children),
      // Underline has no Markdown equivalent — emit plain text, not `<u>`.
      underline: ({ children }) => children,
    },
    types: {
      // Sanity images carry `{id, alt, caption}`, not `{src, alt, title}`.
      // Resolve the CDN URL via the caller-supplied resolver when available.
      image: ({ value, isInline }) => {
        if (isInline) {
          return "";
        }
        const node = value as PortableTextNode;
        const alt = (node.alt ?? "").trim();
        const caption = (node.caption ?? "").trim();
        const url = node.id
          ? options.resolveImageUrl?.(node as MarkdownImage)
          : undefined;

        if (url) {
          const img = `![${alt}](${formatUrl(url)})`;
          return caption && caption !== alt ? `${img}\n\n_${caption}_` : img;
        }

        // No resolvable URL — keep textual content instead of broken markup.
        return caption || alt;
      },
    },
    // Suppress unknown block types; the default emits a JSON code block.
    unknownType: () => "",
  }).trim();
}
