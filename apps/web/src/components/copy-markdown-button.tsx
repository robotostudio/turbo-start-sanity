"use client";

import { CopyIcon } from "@workspace/sanity-blocks/internal/icons";
import {
  COPY_STATUS_CLASS,
  type CopyStatus,
  SWAP_HIDDEN,
  SWAP_LAYER,
  SWAP_SHOWN,
  SWAP_TEXT_HIDDEN,
  SWAP_TEXT_SHOWN,
  useCopyToClipboard,
} from "@workspace/sanity-blocks/internal/use-copy";
import { cn } from "@workspace/tailwind-config/utils";
import { Check, Loader2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback } from "react";

const LABELS: Record<CopyStatus, string> = {
  idle: "Copy as markdown",
  loading: "Copying…",
  copied: "Copied",
  error: "Copy failed",
};

const STATUS_ICONS = {
  idle: CopyIcon,
  loading: Loader2,
  copied: Check,
  error: X,
} as const;

const STATUSES = Object.keys(STATUS_ICONS) as CopyStatus[];

/** Every page is also served as Markdown at its `.md` path. */
function markdownPath(pathname: string): string {
  return pathname === "/" ? "/index.md" : `${pathname}.md`;
}

export function CopyMarkdownButton({
  className,
}: Readonly<{ className?: string }>) {
  const pathname = usePathname();
  const getMarkdown = useCallback(async () => {
    const response = await fetch(markdownPath(pathname));
    if (!response.ok) {
      throw new Error("Failed to fetch markdown");
    }
    return await response.text();
  }, [pathname]);
  const { status, copy } = useCopyToClipboard(getMarkdown);

  return (
    <button
      aria-label={LABELS.idle}
      className={cn(
        "-mr-2 focus-ring inline-flex min-h-10 items-center gap-2 px-2 uppercase font-light font-mono text-muted-foreground text-sm leading-5 tracking-[0.24px] transition-colors duration-150 ease-out hover:text-foreground motion-reduce:transition-none",
        COPY_STATUS_CLASS[status],
        className
      )}
      onClick={copy}
      type="button"
    >
      <span
        aria-hidden="true"
        className="grid size-4.5 flex-none place-items-center"
      >
        {STATUSES.map((s) => {
          const Icon = STATUS_ICONS[s];
          const active = s === status;
          return (
            <Icon
              className={cn(
                SWAP_LAYER,
                "size-4.5",
                active ? SWAP_SHOWN : SWAP_HIDDEN,
                active && s === "loading" && "animate-spin"
              )}
              key={s}
            />
          );
        })}
      </span>
      <span className="grid text-left">
        <span aria-hidden="true" className="col-start-1 row-start-1 invisible">
          {LABELS.idle}
        </span>
        {STATUSES.map((s) => (
          <span
            aria-hidden="true"
            className={cn(
              SWAP_LAYER,
              "truncate",
              s === status ? SWAP_TEXT_SHOWN : SWAP_TEXT_HIDDEN
            )}
            key={s}
          >
            {LABELS[s]}
          </span>
        ))}
        {/* Live region: the spoken confirmation that the copy landed. */}
        <output className="sr-only">{LABELS[status]}</output>
      </span>
    </button>
  );
}
