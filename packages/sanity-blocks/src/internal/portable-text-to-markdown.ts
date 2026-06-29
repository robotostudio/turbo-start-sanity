/**
 * Serializes `richText` portable-text arrays to Markdown. Pure (no React), so
 * blocks degrade to semantic Markdown instead of leaking JSX like
 * `<FAQComponent/>` when content is requested as Markdown.
 */

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
  openInNewTab?: boolean | null;
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

type Rendered = { md: string; isList: boolean };

const DECORATOR_WRAPPERS: Record<string, [string, string]> = {
  strong: ["**", "**"],
  em: ["_", "_"],
  "strike-through": ["~~", "~~"],
  code: ["`", "`"],
};

const isHeadingStyle = (style: string): boolean => /^h[1-6]$/.test(style);

// Escape inline Markdown metacharacters so literal author text (e.g.
// `user_name_field`) isn't reinterpreted as italics/bold/links.
export function escapeMarkdown(text: string): string {
  return text.replace(/([\\`*_[\]<>~|#])/g, "\\$1");
}

function serializeSpan(
  span: PortableTextSpan,
  markDefs: PortableTextMarkDef[]
): string {
  const rawText = span.text ?? "";
  if (!rawText) {
    return "";
  }

  let text = escapeMarkdown(rawText);
  const marks = span.marks ?? [];

  // Decorators wrap the text first (innermost), so a linked span becomes
  // `[**text**](href)` rather than `**[text](href)**`.
  for (const mark of marks) {
    const wrapper = DECORATOR_WRAPPERS[mark];
    if (wrapper) {
      text = `${wrapper[0]}${text}${wrapper[1]}`;
    }
  }

  const linkDef = marks
    .map((mark) => markDefs.find((def) => def._key === mark))
    .find((def): def is PortableTextMarkDef => Boolean(def));

  if (linkDef?._type === "customLink" && linkDef.href && linkDef.href !== "#") {
    text = `[${text}](${linkDef.href})`;
  }

  return text;
}

function renderImage(
  node: PortableTextNode,
  options: MarkdownOptions
): Rendered | null {
  const alt = (node.alt ?? "").trim();
  const caption = (node.caption ?? "").trim();
  const url = node.id ? options.resolveImageUrl?.(node) : undefined;

  if (url) {
    const image = `![${escapeMarkdown(alt)}](${url})`;
    return {
      md:
        caption && caption !== alt
          ? `${image}\n\n_${escapeMarkdown(caption)}_`
          : image,
      isList: false,
    };
  }

  // No resolvable URL — keep the textual content instead of broken markup.
  const text = escapeMarkdown(caption || alt);
  return text ? { md: text, isList: false } : null;
}

function renderTextBlock(node: PortableTextNode): Rendered | null {
  const markDefs = node.markDefs ?? [];
  const text = (node.children ?? [])
    .map((child) => serializeSpan(child, markDefs))
    .join("")
    .trim();

  if (!text) {
    return null;
  }

  if (node.listItem === "bullet" || node.listItem === "number") {
    const indent = "  ".repeat(Math.max(0, (node.level ?? 1) - 1));
    const marker = node.listItem === "number" ? "1." : "-";
    return { md: `${indent}${marker} ${text}`, isList: true };
  }

  const style = node.style ?? "normal";

  if (isHeadingStyle(style)) {
    const hashes = "#".repeat(Number(style[1]));
    return { md: `${hashes} ${text}`, isList: false };
  }

  if (style === "blockquote") {
    const quoted = text
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    return { md: quoted, isList: false };
  }

  return { md: text, isList: false };
}

function renderNode(
  node: PortableTextNode,
  options: MarkdownOptions
): Rendered | null {
  if (node._type === "image") {
    return renderImage(node, options);
  }
  return renderTextBlock(node);
}

/**
 * Converts a portable-text array to a Markdown string. Consecutive list items
 * are kept together (single newline); everything else is separated by a blank
 * line.
 */
export function portableTextToMarkdown(
  blocks: PortableTextValue,
  options: MarkdownOptions = {}
): string {
  if (!Array.isArray(blocks)) {
    return "";
  }

  let out = "";
  let prevWasList = false;

  for (const block of blocks) {
    const rendered = renderNode(block, options);
    if (!rendered) {
      continue;
    }
    if (out) {
      out += rendered.isList && prevWasList ? "\n" : "\n\n";
    }
    out += rendered.md;
    prevWasList = rendered.isList;
  }

  return out;
}
