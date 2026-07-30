"use client";

import { CopyIcon } from "@workspace/sanity-blocks/internal/icons";
import {
  type CopyStatus,
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
};

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

  const StatusIcon = STATUS_ICONS[status];

  return (
    <button
      aria-label={LABELS[status]}
      className={cn(
        "-mr-2 focus-ring inline-flex min-h-10 items-center gap-2 px-2 uppercase font-light font-mono text-muted-foreground text-sm leading-5 tracking-[0.24px] transition-colors duration-150 ease-out hover:text-foreground motion-reduce:transition-none",
        className
      )}
      onClick={copy}
      type="button"
    >
      <span
        aria-hidden="true"
        className="grid size-4.5 flex-none place-items-center"
      >
        <StatusIcon
          className={cn("size-4.5", status === "loading" && "animate-spin")}
        />
      </span>
      <span className="grid text-left">
        <span aria-hidden="true" className="col-start-1 row-start-1 invisible">
          {LABELS.idle}
        </span>
        <span className="col-start-1 row-start-1 truncate">
          {LABELS[status]}
        </span>
      </span>
    </button>
  );
}
