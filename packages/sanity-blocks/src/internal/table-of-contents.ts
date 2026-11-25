import { headingChildrenToSlug, headingTextToSlug } from "./heading-slug";

const HEADING_LEVELS: Record<string, number> = {
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
};

export type TocHeading = {
  id: string;
  slug: string;
  text: string;
  children: TocHeading[];
};

export type TocBlock = {
  _type: string;
  _key?: string | null;
  style?: string | null;
  children?: readonly { _type: string; text?: string | null }[] | null;
};

type FlatHeading = Omit<TocHeading, "children"> & { level: number };

function getFlatHeadings(
  richText: readonly TocBlock[] | null | undefined
): FlatHeading[] {
  const headings: FlatHeading[] = [];

  for (const [index, block] of (richText ?? []).entries()) {
    if (block._type !== "block") {
      continue;
    }
    const level = HEADING_LEVELS[block.style ?? ""];
    const children = block.children ?? [];
    const allText = children.every(
      (child) => child._type === "span" && typeof child.text === "string"
    );
    if (!(level && children.length > 0 && allText)) {
      continue;
    }

    const text = children
      .map((child) => child.text?.trim() ?? "")
      .filter(Boolean)
      .join(" ");
    if (!text) {
      continue;
    }

    const key = block._key || headingTextToSlug(text) || `heading-${index}`;
    headings.push({
      id: `toc-${key}`,
      slug: headingChildrenToSlug(children),
      text,
      level,
    });
  }

  return headings;
}

export function getTableOfContents(
  richText: readonly TocBlock[] | null | undefined
): TocHeading[] {
  const headings: TocHeading[] = [];
  const parents: { level: number; heading: TocHeading }[] = [];

  for (const { level, ...flatHeading } of getFlatHeadings(richText)) {
    const heading = { ...flatHeading, children: [] };
    while (parents.length > 0 && (parents.at(-1)?.level ?? 0) >= level) {
      parents.pop();
    }
    (parents.at(-1)?.heading.children ?? headings).push(heading);
    parents.push({ level, heading });
  }

  return headings;
}
