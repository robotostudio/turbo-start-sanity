"use client";
import {
  CopyIcon,
  InstagramIcon,
  LinkedInIcon,
  RedditIcon,
  XIcon,
} from "@workspace/sanity-blocks/internal/icons";
import { useCopyToClipboard } from "@workspace/sanity-blocks/internal/use-copy";
import { cn } from "@workspace/tailwind-config/utils";
import { Check, ChevronDown } from "lucide-react";
import {
  type FC,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import slugify from "slugify";

import type { SanityRichTextBlock, SanityRichTextProps } from "@/types";

type TableOfContentProps = {
  richText?: SanityRichTextProps;
  className?: string;
  maxDepth?: number;
  shareTitle?: string;
};

type ProcessedHeading = {
  readonly id: string;
  readonly text: string;
  readonly href: string;
  readonly level: number;
  readonly style: HeadingStyle;
  readonly children: ProcessedHeading[];
  readonly isChild: boolean;
  readonly _key?: string;
};

type AnchorProps = {
  readonly heading: ProcessedHeading;
  readonly activeSlug: string | null;
  readonly maxDepth?: number;
  readonly currentDepth?: number;
  // Namespaces the anchor's own DOM id so the desktop and mobile trees can both
  // render without producing duplicate ids.
  readonly idPrefix?: string;
  // Fires after a heading link activates, letting the mobile disclosure close.
  readonly onNavigate?: () => void;
};

type TableOfContentState = {
  readonly shouldShow: boolean;
  readonly headings: ProcessedHeading[];
  readonly error?: string;
};

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
  children: unknown
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

function createSlug(text: string): string {
  if (!text?.trim()) {
    return "";
  }

  try {
    return slugify(text.trim(), SLUGIFY_OPTIONS);
  } catch (_error) {
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
  } catch (_error) {
    return "";
  }
}

function generateUniqueId(text: string, index: number, _key?: string): string {
  const baseId = _key || createSlug(text) || `heading-${index}`;
  return `toc-${baseId}`;
}

function extractHeadingBlocks(richText: SanityRichTextProps): HeadingBlock[] {
  if (!(richText && Array.isArray(richText))) {
    return [];
  }

  try {
    return richText.filter(isHeadingBlock);
  } catch (_error) {
    return [];
  }
}

function createProcessedHeading(
  block: HeadingBlock,
  index: number
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
  } catch (_error) {
    return null;
  }
}

function buildHeadingHierarchy(
  flatHeadings: ProcessedHeading[],
  maxDepth: number = DEFAULT_MAX_DEPTH
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
        maxDepth
      );

      result.push({
        ...heading,
        children,
      });
    });

    return result;
  } catch (_error) {
    return flatHeadings.map((heading) => ({
      ...heading,
      children: [],
    }));
  }
}

function collectChildHeadings(
  headings: ProcessedHeading[],
  parentIndex: number,
  processed: Set<number>,
  maxDepth: number
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
      maxDepth
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
  maxDepth: number = DEFAULT_MAX_DEPTH
): ProcessedHeading[] {
  if (!Array.isArray(headingBlocks) || headingBlocks.length === 0) {
    return [];
  }

  try {
    const processedHeadings = headingBlocks
      .map(createProcessedHeading)
      .filter((heading): heading is ProcessedHeading => heading !== null);

    return buildHeadingHierarchy(processedHeadings, maxDepth);
  } catch (_error) {
    return [];
  }
}

function flattenSlugs(headings: ProcessedHeading[]): string[] {
  const result: string[] = [];
  const walk = (items: ProcessedHeading[]) => {
    for (const item of items) {
      result.push(item.href.replace(/^#/, ""));
      if (item.children.length > 0) {
        walk(item.children);
      }
    }
  };
  walk(headings);
  return result.filter(Boolean);
}

function useTableOfContentState(
  richText?: SanityRichTextProps,
  maxDepth: number = DEFAULT_MAX_DEPTH
): TableOfContentState {
  try {
    if (!(richText && Array.isArray(richText)) || richText.length === 0) {
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
    return {
      shouldShow: false,
      headings: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function useActiveHeading(slugKey: string): string | null {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    const slugs = slugKey ? slugKey.split("|") : [];
    if (slugs.length === 0) {
      return;
    }

    setActiveSlug((prev) => prev ?? slugs[0] ?? null);

    const elements = slugs
      .map((slug) => document.getElementById(slug))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }
        const firstVisible = slugs.find((slug) => visible.has(slug));
        if (firstVisible) {
          setActiveSlug(firstVisible);
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [slugKey]);

  return activeSlug;
}

const TableOfContentAnchor: FC<AnchorProps> = ({
  heading,
  activeSlug,
  maxDepth = DEFAULT_MAX_DEPTH,
  currentDepth = 1,
  idPrefix = "",
  onNavigate,
}) => {
  const { href, text, children, id } = heading;

  if (currentDepth > maxDepth) {
    return null;
  }

  if (!(text?.trim() && href?.trim())) {
    return null;
  }

  const slug = href.replace(/^#/, "");
  const isActive = activeSlug !== null && activeSlug === slug;
  const hasChildren =
    Array.isArray(children) && children.length > 0 && currentDepth < maxDepth;

  // In-page anchors are rendered as native <a>, not next/link. next/link
  // unconditionally preventDefaults hash clicks and defers the scroll to the
  // App Router, whose hash handling races with hydration and intermittently
  // no-ops — so a click during that window is swallowed (default suppressed,
  // no scroll). A native anchor plus this synchronous handler always scrolls:
  // before hydration the browser jumps natively, after hydration we scroll
  // here, and the router is never involved.
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const target = document.getElementById(slug);
    if (!target) {
      // Fall back to the browser's native hash navigation.
      return;
    }
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
    window.history.pushState(null, "", href);
    onNavigate?.();
  };

  return (
    <li className={cn(currentDepth > 1 && "ml-3")}>
      <a
        aria-current={isActive ? "location" : undefined}
        className={cn(
          "block rounded-none px-2 py-1.5 text-base leading-6 outline-none tracking-[0.01em] transition-colors focus-visible:[outline:2px_dotted_currentColor] focus-visible:[outline-offset:-3px]",
          isActive
            ? "bg-accent-green font-medium text-accent-green-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        href={href}
        id={`${idPrefix}${id}`}
        onClick={handleClick}
      >
        {text}
      </a>

      {hasChildren && (
        <ul className="mt-1 flex flex-col gap-1">
          {children.map((child, index) => (
            <TableOfContentAnchor
              activeSlug={activeSlug}
              currentDepth={currentDepth + 1}
              heading={child}
              idPrefix={idPrefix}
              key={child.id || `${child.text}-${index}-${currentDepth}`}
              maxDepth={maxDepth}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

type ShareTarget = {
  readonly network: string;
  readonly label: string;
  readonly icon: FC<{ className?: string }>;
  readonly url: (encodedUrl: string, encodedTitle: string) => string;
  // Networks with no web share-URL endpoint (Instagram) use the native Web
  // Share sheet instead of a plain link.
  readonly webShare?: boolean;
};

const SHARE_TARGETS: readonly ShareTarget[] = [
  {
    network: "X",
    label: "Post",
    icon: XIcon,
    url: (u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
  },
  {
    network: "Instagram",
    label: "Post",
    icon: InstagramIcon,
    url: () => "https://www.instagram.com/",
    webShare: true,
  },
  {
    network: "LinkedIn",
    label: "Share",
    icon: LinkedInIcon,
    url: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
  },
  {
    network: "Reddit",
    label: "Post",
    icon: RedditIcon,
    url: (u, t) => `https://www.reddit.com/submit?url=${u}&title=${t}`,
  },
] as const;

function ShareOptions({ title }: Readonly<{ title?: string }>) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const getShareUrl = useCallback(() => url || window.location.href, [url]);
  const { status: copyStatus, copy } = useCopyToClipboard(getShareUrl);
  const copied = copyStatus === "copied";

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title ?? "");

  const handleWebShare = async (fallbackUrl: string) => {
    const shareUrl = url || window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: title || undefined, url: shareUrl });
        return;
      } catch {
        // Cancelled or the share failed — fall through to the fallback link.
      }
    }
    window.open(fallbackUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex items-center justify-between border-t border-zinc-900 px-1 pt-4 dark:border-zinc-50">
      {SHARE_TARGETS.map((target) => {
        const shareClass =
          "focus-ring-inset flex flex-col items-center justify-center gap-1 rounded-none px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground";
        if (target.webShare) {
          return (
            <button
              aria-label={`Share on ${target.network}`}
              className={shareClass}
              key={target.network}
              onClick={() =>
                handleWebShare(target.url(encodedUrl, encodedTitle))
              }
              type="button"
            >
              <target.icon className="size-4.5" />
              <span className="text-xs tracking-[0.02em]">{target.label}</span>
            </button>
          );
        }
        return (
          <a
            aria-label={`Share on ${target.network}`}
            className={shareClass}
            href={target.url(encodedUrl, encodedTitle)}
            key={target.network}
            rel="noopener noreferrer"
            target="_blank"
          >
            <target.icon className="size-4.5" />
            <span className="text-xs tracking-[0.02em]">{target.label}</span>
          </a>
        );
      })}
      <button
        className="focus-ring-inset flex flex-col items-center justify-center gap-1 rounded-none px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
        onClick={copy}
        type="button"
      >
        <span className="grid size-4.5 place-items-center">
          {copied ? (
            <Check aria-hidden="true" className="size-4.5" />
          ) : (
            <CopyIcon className="size-4.5" />
          )}
        </span>
        {/* Stack both labels in one grid cell so the button always reserves the
            wider "Copied" width — the hidden label holds the space, so toggling
            copied↔not never shifts the justify-between row. */}
        <span className="grid text-xs tracking-[0.02em]">
          <span
            className={cn(
              "col-start-1 row-start-1",
              copied ? "visible" : "invisible"
            )}
          >
            Copied
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1",
              copied ? "invisible" : "visible"
            )}
          >
            Copy
          </span>
        </span>
      </button>
    </div>
  );
}

export const TableOfContent: FC<TableOfContentProps> = ({
  richText,
  className,
  maxDepth = DEFAULT_MAX_DEPTH,
  shareTitle,
}) => {
  const { shouldShow, headings, error } = useTableOfContentState(
    richText,
    maxDepth
  );

  const slugKey = flattenSlugs(headings).join("|");
  const activeSlug = useActiveHeading(slugKey);

  if (error) {
    return null;
  }

  if (!shouldShow || headings.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-grid-dots p-6 text-zinc-800 dark:text-zinc-50",
        className
      )}
    >
      <aside
        aria-labelledby="toc-heading"
        className="flex flex-col gap-12 bg-background p-4"
      >
        <nav aria-labelledby="toc-heading">
          <p className="text-foreground text-lg" id="toc-heading">
            On this page
          </p>
          <ul className="mt-6 flex flex-col gap-2">
            {headings.map((heading, index) => (
              <TableOfContentAnchor
                activeSlug={activeSlug}
                currentDepth={1}
                heading={heading}
                key={heading.id || `${heading.text}-${index}`}
                maxDepth={maxDepth}
              />
            ))}
          </ul>
        </nav>

        <ShareOptions title={shareTitle} />
      </aside>
    </div>
  );
};

export const MobileTableOfContent: FC<TableOfContentProps> = ({
  richText,
  className,
  maxDepth = DEFAULT_MAX_DEPTH,
  shareTitle,
}) => {
  const { shouldShow, headings, error } = useTableOfContentState(
    richText,
    maxDepth
  );

  const slugKey = flattenSlugs(headings).join("|");
  const activeSlug = useActiveHeading(slugKey);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  if (error || !shouldShow || headings.length === 0) {
    return null;
  }

  const closeDisclosure = () => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  return (
    <details
      className={cn(
        "faq-disclosure group bg-grid-dots p-2.5 text-zinc-800 lg:hidden dark:text-zinc-50",
        className
      )}
      ref={detailsRef}
    >
      <summary className="focus-ring-inset flex cursor-pointer list-none items-center justify-between gap-2 bg-background px-4 py-3 text-foreground text-lg [&::-webkit-details-marker]:hidden">
        On this page
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-8 bg-background px-4 pb-4">
        <nav aria-label="On this page">
          <ul className="flex flex-col gap-2">
            {headings.map((heading, index) => (
              <TableOfContentAnchor
                activeSlug={activeSlug}
                currentDepth={1}
                heading={heading}
                idPrefix="mobile-"
                key={heading.id || `${heading.text}-${index}`}
                maxDepth={maxDepth}
                onNavigate={closeDisclosure}
              />
            ))}
          </ul>
        </nav>
        <ShareOptions title={shareTitle} />
      </div>
    </details>
  );
};
