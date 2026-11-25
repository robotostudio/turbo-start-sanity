"use client";

import {
  CopyIcon,
  InstagramIcon,
  LinkedInIcon,
  RedditIcon,
  XIcon,
} from "@workspace/sanity-blocks/internal/icons";
import {
  COPY_STATUS_CLASS,
  SWAP_HIDDEN,
  SWAP_LAYER,
  SWAP_SHOWN,
  SWAP_TEXT_HIDDEN,
  SWAP_TEXT_SHOWN,
  useCopyToClipboard,
} from "@workspace/sanity-blocks/internal/use-copy";
import { cn } from "@workspace/tailwind-config/utils";
import { Check, ChevronDown } from "lucide-react";
import { type FC, type MouseEvent, useEffect, useRef, useState } from "react";

import type { TocHeading } from "@/lib/table-of-contents";

type TableOfContentProps = {
  headings: TocHeading[];
  className?: string;
  shareTitle?: string;
  shareUrl?: string;
};

type AnchorProps = {
  readonly heading: TocHeading;
  readonly activeSlug: string | null;
  readonly onSelect: (slug: string) => void;
  readonly depth?: number;
  // Namespaces the anchor's own DOM id so the desktop and mobile trees can both
  // render without producing duplicate ids.
  readonly idPrefix?: string;
};

// The y-offset a heading must pass to count as current. Matches the headings'
// own scroll-margin-top (`prose-headings:scroll-m-24`), so a heading reached by
// clicking the TOC is active the moment it lands rather than one item behind.
const READING_LINE = 96;
// `scrollIntoView` is sub-pixel while the scroll offset is rounded, so exact
// comparison misses by a fraction and credits the heading above.
const READING_LINE_SLACK = 2;

// Close animation duration plus a settle frame — scrolling waits this long.
const DISCLOSURE_CLOSE_MS = 320;

const SCROLL_SETTLE_MS = 150;

function flattenHeadings(headings: TocHeading[]): TocHeading[] {
  return headings.flatMap((heading) => [
    heading,
    ...flattenHeadings(heading.children),
  ]);
}

function useActiveHeading(headings: TocHeading[]) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const clickedSlug = useRef<string | null>(null);
  const slugKey = flattenHeadings(headings)
    .map((heading) => heading.slug)
    .join("|");

  useEffect(() => {
    const elements = slugKey
      .split("|")
      .flatMap((slug) => document.getElementById(slug) ?? []);
    if (elements.length === 0) {
      return;
    }

    const updateActiveHeading = () => {
      if (clickedSlug.current) {
        return;
      }
      // The last heading can't always reach the line — there isn't necessarily
      // a viewport of content beneath it.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      const current = atBottom
        ? elements.at(-1)
        : elements.findLast(
            (element) =>
              element.getBoundingClientRect().top <=
              READING_LINE + READING_LINE_SLACK
          );
      setActiveSlug(current?.id ?? null);
    };

    let frame = 0;
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActiveHeading);
    };

    const onScrollEnd = () => {
      clickedSlug.current = null;
      scheduleUpdate();
    };

    let settleTimer = 0;
    const onScroll = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(onScrollEnd, SCROLL_SETTLE_MS);
    };

    const observer = new IntersectionObserver(scheduleUpdate, {
      rootMargin: `-${READING_LINE}px 0px 0px 0px`,
    });
    for (const element of elements) {
      observer.observe(element);
    }
    const hasScrollEnd = "onscrollend" in window;
    const settledEvent = hasScrollEnd ? "scrollend" : "scroll";
    const onSettled = hasScrollEnd ? onScrollEnd : onScroll;
    window.addEventListener(settledEvent, onSettled, { passive: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.removeEventListener(settledEvent, onSettled);
    };
  }, [slugKey]);

  const showClicked = (slug: string) => {
    clickedSlug.current = slug;
    setActiveSlug(slug);
  };

  return { activeSlug, showClicked };
}

function TableOfContentAnchor({
  heading,
  activeSlug,
  onSelect,
  depth = 1,
  idPrefix = "",
}: AnchorProps) {
  const { slug, text, children, id } = heading;
  const href = `#${slug}`;
  const isActive = activeSlug !== null && activeSlug === slug;

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
    window.history.pushState(null, "", href);
    const details = event.currentTarget.closest("details");
    if (details) {
      // Mobile: collapse the disclosure first, then scroll once its close
      // animation has settled. Scrolling immediately overshoots — the TOC
      // above the target shrinks mid-scroll, pulling the heading up and past
      // the viewport top.
      details.open = false;
      window.setTimeout(() => {
        onSelect(slug);
        target.scrollIntoView({ behavior: "smooth" });
      }, DISCLOSURE_CLOSE_MS);
      return;
    }
    onSelect(slug);
    target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <li className={cn(depth > 1 && "ml-3")}>
      <a
        aria-current={isActive ? "location" : undefined}
        className={cn(
          "block rounded-none px-2 py-1.5 text-base leading-6 outline-none tracking-[0.01em] focus-visible:[outline:2px_dotted_currentColor] focus-visible:[outline-offset:-3px]",
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

      {children.length > 0 && (
        <ul className="mt-1 flex flex-col gap-1">
          {children.map((child) => (
            <TableOfContentAnchor
              activeSlug={activeSlug}
              depth={depth + 1}
              heading={child}
              idPrefix={idPrefix}
              key={child.id}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

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

function ShareOptions({
  title,
  shareUrl,
}: Readonly<{ title?: string; shareUrl?: string }>) {
  const getShareUrl = () => shareUrl || window.location.href;
  const { status: copyStatus, copy } = useCopyToClipboard(getShareUrl);
  const copied = copyStatus === "copied";

  const encodedUrl = encodeURIComponent(shareUrl ?? "");
  const encodedTitle = encodeURIComponent(title ?? "");

  const handleWebShare = async (fallbackUrl: string) => {
    const resolvedUrl = getShareUrl();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: title || undefined, url: resolvedUrl });
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
        aria-label="Copy link to clipboard"
        className={cn(
          "focus-ring-inset flex flex-col items-center justify-center gap-1 rounded-none px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground",
          COPY_STATUS_CLASS[copyStatus]
        )}
        onClick={copy}
        type="button"
      >
        <span aria-hidden="true" className="grid size-4.5 place-items-center">
          <Check
            className={cn(
              SWAP_LAYER,
              "size-4.5",
              copied ? SWAP_SHOWN : SWAP_HIDDEN
            )}
          />
          <CopyIcon
            className={cn(
              SWAP_LAYER,
              "size-4.5",
              copied ? SWAP_HIDDEN : SWAP_SHOWN
            )}
          />
        </span>
        <span aria-hidden="true" className="grid text-xs tracking-[0.02em]">
          <span
            className={cn(
              SWAP_LAYER,
              copied ? SWAP_TEXT_SHOWN : SWAP_TEXT_HIDDEN
            )}
          >
            Copied
          </span>
          <span
            className={cn(
              SWAP_LAYER,
              copied ? SWAP_TEXT_HIDDEN : SWAP_TEXT_SHOWN
            )}
          >
            Copy
          </span>
        </span>
        <output className="sr-only">
          {copyStatus === "copied" ? "Link copied to clipboard" : ""}
          {copyStatus === "error" ? "Could not copy link" : ""}
        </output>
      </button>
    </div>
  );
}

export function TableOfContent({
  headings,
  className,
  shareTitle,
  shareUrl,
}: Readonly<TableOfContentProps>) {
  const { activeSlug, showClicked } = useActiveHeading(headings);

  if (headings.length === 0) {
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
            {headings.map((heading) => (
              <TableOfContentAnchor
                activeSlug={activeSlug}
                heading={heading}
                key={heading.id}
                onSelect={showClicked}
              />
            ))}
          </ul>
        </nav>

        <ShareOptions shareUrl={shareUrl} title={shareTitle} />
      </aside>
    </div>
  );
}

export function MobileTableOfContent({
  headings,
  className,
  shareTitle,
  shareUrl,
}: Readonly<TableOfContentProps>) {
  const { activeSlug, showClicked } = useActiveHeading(headings);
  const activeText = flattenHeadings(headings).find(
    (heading) => heading.slug === activeSlug
  )?.text;

  if (headings.length === 0) {
    return null;
  }

  return (
    <details
      className={cn(
        "group disclosure bleed-x sticky top-0 z-30 bg-grid-dots p-2.5 text-zinc-800 lg:hidden dark:text-zinc-50",
        className
      )}
    >
      <summary className="focus-ring-inset flex cursor-pointer list-none items-center justify-between gap-2 bg-background px-4 py-3 text-foreground text-lg [&::-webkit-details-marker]:hidden">
        <span className="truncate">{activeText ?? "On this page"}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="flex max-h-[60svh] flex-col gap-8 overflow-y-auto bg-background px-4 pb-4">
        <nav aria-label="On this page">
          <ul className="flex flex-col gap-2">
            {headings.map((heading) => (
              <TableOfContentAnchor
                activeSlug={activeSlug}
                heading={heading}
                idPrefix="mobile-"
                key={heading.id}
                onSelect={showClicked}
              />
            ))}
          </ul>
        </nav>
        <ShareOptions shareUrl={shareUrl} title={shareTitle} />
      </div>
    </details>
  );
}
