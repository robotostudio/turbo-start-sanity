import slugify from "slugify";

function textOf(child: unknown): string {
  if (typeof child !== "object" || child === null || !("text" in child)) {
    return "";
  }
  const { text } = child as { text?: unknown };
  return typeof text === "string" ? text : "";
}

/**
 * The single source of truth for heading anchors.
 *
 * The rich-text renderer stamps this on every heading as its DOM `id`, and the
 * table of contents builds its `#hash` links from it. Both must agree — a
 * heading holding a bolded or linked word arrives as several Portable Text
 * spans, so joining them any other way (with spaces, say) yields a link that
 * points at nothing.
 */
export function headingChildrenToSlug(
  children: readonly unknown[] | null | undefined
): string {
  if (!children) {
    return "";
  }
  return headingTextToSlug(children.map(textOf).join(""));
}

export function headingTextToSlug(text: string): string {
  return slugify(text.trim(), { lower: true, remove: /[^a-zA-Z0-9 ]/g });
}
