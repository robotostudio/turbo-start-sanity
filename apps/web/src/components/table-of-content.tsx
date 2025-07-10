import { cn } from "@workspace/ui/lib/utils";
import { ChevronDown, Circle } from "lucide-react";
import Link from "next/link";
import { type FC, useCallback, useMemo } from "react";
import slugify from "slugify";

import type { SanityRichTextBlock, SanityRichTextProps } from "@/types";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface TableOfContentProps {
  richText?: SanityRichTextProps;
  className?: string;
  maxDepth?: number;
}

interface ProcessedHeading {
  readonly id: string;
  readonly text: string;
  readonly href: string;
  readonly level: number;
  readonly style: HeadingStyle;
  readonly children: ProcessedHeading[];
  readonly isChild: boolean;
  readonly _key?: string;
}

interface AnchorProps {
  readonly heading: ProcessedHeading;
  readonly maxDepth?: number;
  readonly currentDepth?: number;
}

interface TableOfContentState {
  readonly shouldShow: boolean;
  readonly headings: ProcessedHeading[];
  readonly error?: string;
}

type HeadingStyle = "h2" | "h3" | "h4" | "h5" | "h6";

type SanityTextChild = {
  readonly marks?: readonly string[];
  readonly text?: string;
  readonly _type: "span";
  readonly _key: string;
};

type HeadingBlock = Extract<SanityRichTextBlock, { _type: "block" }> & {
  style: HeadingStyle;
  children: readonly SanityTextChild[];
};

// ============================================================================
// CONSTANTS
// ============================================================================

const HEADING_STYLES: Record<HeadingStyle, string> = {
  h2: "pl-0",
  h3: "pl-4",
  h4: "pl-8",
  h5: "pl-12",
  h6: "pl-16",
} as const;

const HEADING_LEVELS: Record<HeadingStyle, number> = {
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
} as const;

const SLUGIFY_OPTIONS = {
  lower: true,
  strict: true,
  remove: /[*+~.()'"!:@]/g,
} as const;

const DEFAULT_MAX_DEPTH = 6;
const MIN_HEADINGS_TO_SHOW = 1;

// ============================================================================
// TYPE GUARDS & VALIDATORS
// ============================================================================

function isValidHeadingStyle(style: unknown): style is HeadingStyle {
  return typeof style === "string" && style in HEADING_STYLES;
}

function isValidTextChild(child: unknown): child is SanityTextChild {
  return (
    typeof child === "object" &&
    child !== null &&
    "_type" in child &&
    child._type === "span" &&
    "text" in child &&
    typeof child.text === "string"
  );
}

function hasValidTextChildren(
  children: unknown,
): children is readonly SanityTextChild[] {
  return (
    Array.isArray(children) &&
    children.length > 0 &&
    children.every(isValidTextChild)
  );
}

function isHeadingBlock(block: unknown): block is HeadingBlock {
  if (
    typeof block !== "object" ||
    block === null ||
    !("_type" in block) ||
    block._type !== "block"
  ) {
    return false;
  }

  const candidate = block as Record<string, unknown>;

  return (
    isValidHeadingStyle(candidate.style) &&
    hasValidTextChildren(candidate.children)
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function createSlug(text: string): string {
  if (!text?.trim()) {
    return "";
  }

  try {
    return slugify(text.trim(), SLUGIFY_OPTIONS);
  } catch (error) {
    console.warn("Failed to create slug for text:", text, error);
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  }
}

function extractTextFromChildren(children: readonly SanityTextChild[]): string {
  try {
    return children
      .map((child) => child.text?.trim() ?? "")
      .filter(Boolean)
      .join(" ")
      .trim();
  } catch (error) {
    console.warn("Failed to extract text from children:", error);
    return "";
  }
}

function generateUniqueId(text: string, index: number, _key?: string): string {
  const baseId = _key || createSlug(text) || `heading-${index}`;
  return `toc-${baseId}`;
}

// ============================================================================
// CORE BUSINESS LOGIC
// ============================================================================

function extractHeadingBlocks(richText: SanityRichTextProps): HeadingBlock[] {
  if (!richText || !Array.isArray(richText)) {
    return [];
  }

  try {
    return richText.filter(isHeadingBlock);
  } catch (error) {
    console.error("Failed to extract heading blocks:", error);
    return [];
  }
}

function createProcessedHeading(
  block: HeadingBlock,
  index: number,
): ProcessedHeading | null {
  try {
    const text = extractTextFromChildren(block.children);

    if (!text) {
      return null;
    }

    const level = HEADING_LEVELS[block.style];
    const href = `#${createSlug(text)}`;
    const id = generateUniqueId(text, index, block._key);

    return {
      id,
      text,
      href,
      level,
      style: block.style,
      children: [],
      isChild: false,
      _key: block._key,
    };
  } catch (error) {
    console.warn("Failed to create processed heading:", error);
    return null;
  }
}

function buildHeadingHierarchy(
  flatHeadings: ProcessedHeading[],
  maxDepth: number = DEFAULT_MAX_DEPTH,
): ProcessedHeading[] {
  if (flatHeadings.length === 0) {
    return [];
  }

  try {
    const result: ProcessedHeading[] = [];
    const processed = new Set<number>();

    flatHeadings.forEach((heading, index) => {
      if (processed.has(index) || heading.level > maxDepth) {
        return;
      }

      const children = collectChildHeadings(
        flatHeadings,
        index,
        processed,
        maxDepth,
      );

      result.push({
        ...heading,
        children,
      });
    });

    return result;
  } catch (error) {
    console.error("Failed to build heading hierarchy:", error);
    return flatHeadings.map((heading) => ({ ...heading, children: [] }));
  }
}

function collectChildHeadings(
  headings: ProcessedHeading[],
  parentIndex: number,
  processed: Set<number>,
  maxDepth: number,
): ProcessedHeading[] {
  const parentHeading = headings[parentIndex];

  if (!parentHeading || parentHeading.level >= maxDepth) {
    return [];
  }

  const children: ProcessedHeading[] = [];
  const parentLevel = parentHeading.level;

  for (let i = parentIndex + 1; i < headings.length; i++) {
    const currentHeading = headings[i];

    if (!currentHeading || currentHeading.level <= parentLevel) {
      break;
    }

    if (processed.has(i) || currentHeading.level > maxDepth) {
      continue;
    }

    processed.add(i);

    const nestedChildren = collectChildHeadings(
      headings,
      i,
      processed,
      maxDepth,
    );

    children.push({
      ...currentHeading,
      children: nestedChildren,
      isChild: true,
    });
  }

  return children;
}

function processHeadingBlocks(
  headingBlocks: HeadingBlock[],
  maxDepth: number = DEFAULT_MAX_DEPTH,
): ProcessedHeading[] {
  if (!Array.isArray(headingBlocks) || headingBlocks.length === 0) {
    return [];
  }

  try {
    const processedHeadings = headingBlocks
      .map(createProcessedHeading)
      .filter((heading): heading is ProcessedHeading => heading !== null);

    return buildHeadingHierarchy(processedHeadings, maxDepth);
  } catch (error) {
    console.error("Failed to process heading blocks:", error);
    return [];
  }
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useTableOfContentState(
  richText?: SanityRichTextProps,
  maxDepth: number = DEFAULT_MAX_DEPTH,
): TableOfContentState {
  return useMemo(() => {
    try {
      if (!richText || !Array.isArray(richText) || richText.length === 0) {
        return {
          shouldShow: false,
          headings: [],
        };
      }

      const headingBlocks = extractHeadingBlocks(richText);

      if (headingBlocks.length < MIN_HEADINGS_TO_SHOW) {
        return {
          shouldShow: false,
          headings: [],
        };
      }

      const processedHeadings = processHeadingBlocks(headingBlocks, maxDepth);

      return {
        shouldShow: processedHeadings.length >= MIN_HEADINGS_TO_SHOW,
        headings: processedHeadings,
      };
    } catch (error) {
      console.error("Error processing table of contents:", error);
      return {
        shouldShow: false,
        headings: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, [richText, maxDepth]);
}

// ============================================================================
// COMPONENTS
// ============================================================================

const TableOfContentAnchor: FC<AnchorProps> = ({
  heading,
  maxDepth = DEFAULT_MAX_DEPTH,
  currentDepth = 1,
}) => {
  const { href, text, children, isChild, style, id } = heading;

  const shouldRenderChildren = useCallback(() => {
    return (
      Array.isArray(children) && children.length > 0 && currentDepth < maxDepth
    );
  }, [children, currentDepth, maxDepth]);

  // Don't render if we're at max depth and this is a child
  if (currentDepth > maxDepth) {
    return null;
  }

  // Don't render if text or href is invalid
  if (!text?.trim() || !href?.trim()) {
    return null;
  }

  const hasChildren = shouldRenderChildren();

  return (
    <li
      className={cn(
        "list-inside my-2 transition-all duration-200",
        // paddingClass,
        isChild && "ml-1.5",
      )}
    >
      <div className="flex items-center gap-2">
        <Circle
          className={cn(
            "min-w-1.5 min-h-1.5 size-1.5 transition-colors duration-200",
            !isChild
              ? "dark:fill-zinc-100 fill-zinc-900"
              : "dark:fill-zinc-400 fill-zinc-600",
          )}
          aria-hidden="true"
        />
        <Link
          href={href}
          className={cn(
            "hover:text-blue-500 hover:underline line-clamp-1",
            "transition-colors duration-200 focus:outline-none",
            "rounded-sm px-1 py-0.5",
          )}
          aria-describedby={`${id}-level`}
        >
          {text}
        </Link>
        <span id={`${id}-level`} className="sr-only">
          Heading level {heading.level}
        </span>
      </div>

      {hasChildren && (
        <ul className="mt-1">
          {children.map((child, index) => (
            <TableOfContentAnchor
              key={child.id || `${child.text}-${index}-${currentDepth}`}
              heading={child}
              maxDepth={maxDepth}
              currentDepth={currentDepth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const TableOfContent: FC<TableOfContentProps> = ({
  richText,
  className,
  maxDepth = DEFAULT_MAX_DEPTH,
}) => {
  const { shouldShow, headings, error } = useTableOfContentState(
    richText,
    maxDepth,
  );

  // Early return for error state
  if (error) {
    console.error("Table of Contents error:", error);
    return null;
  }

  // Early return if nothing to show
  if (!shouldShow || headings.length === 0) {
    return null;
  }

  return (
    <aside
      className={cn(
        "sticky top-8 flex flex-col w-full max-w-xs p-4",
        "bg-gradient-to-b from-zinc-50 to-zinc-100",
        "dark:from-zinc-800 dark:to-zinc-900",
        "shadow-sm rounded-lg border border-zinc-300 dark:border-zinc-700",
        "transition-all duration-200",
        className,
      )}
      aria-labelledby="toc-heading"
      role="complementary"
    >
      <details className="group" open>
        <summary
          className={cn(
            "flex cursor-pointer items-center justify-between",
            "text-lg font-semibold text-zinc-800 dark:text-zinc-200",
            "hover:text-blue-600 dark:hover:text-blue-400",
            "transition-colors duration-200 focus:outline-none",
            "rounded-sm p-1",
          )}
          id="toc-heading"
        >
          <span>Table of Contents</span>
          <ChevronDown
            className={cn(
              "h-5 w-5 transform transition-transform duration-200",
              "group-open:rotate-180",
            )}
            aria-hidden="true"
          />
        </summary>

        <nav aria-labelledby="toc-heading">
          <ul className="text-sm space-y-1 mt-4 ml-3">
            {headings.map((heading, index) => (
              <TableOfContentAnchor
                key={heading.id || `${heading.text}-${index}`}
                heading={heading}
                maxDepth={maxDepth}
                currentDepth={1}
              />
            ))}
          </ul>
        </nav>
      </details>
    </aside>
  );
};
