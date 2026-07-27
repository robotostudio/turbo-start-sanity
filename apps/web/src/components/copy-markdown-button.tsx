"use client";

import { cn } from "@workspace/tailwind-config/utils";
import { Check, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CopyLinkIcon } from "@/components/icons";

const RESET_MS = 1200;

type CopyStatus = "idle" | "copied" | "error";

const LABELS: Record<CopyStatus, string> = {
  idle: "Copy as markdown",
  copied: "Copied",
  error: "Copy failed",
};

const ICON_BASE = "col-start-1 row-start-1 size-4.5";

/** Every page is also served as Markdown at its `.md` path. */
function markdownPath(pathname: string): string {
  return pathname === "/" ? "/index.md" : `${pathname}.md`;
}

export function CopyMarkdownButton({
  className,
}: Readonly<{ className?: string }>) {
  const pathname = usePathname();
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const handleCopy = useCallback(async () => {
    let next: CopyStatus = "error";
    try {
      const response = await fetch(markdownPath(pathname));
      if (response.ok) {
        await navigator.clipboard.writeText(await response.text());
        next = "copied";
      }
    } catch {
      next = "error";
    }

    setStatus(next);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setStatus("idle"), RESET_MS);
  }, [pathname]);

  const icons = [
    { Icon: CopyLinkIcon, key: "idle", shown: status === "idle" },
    { Icon: Check, key: "copied", shown: status === "copied" },
    { Icon: X, key: "error", shown: status === "error" },
  ];

  return (
    <button
      aria-label={LABELS[status]}
      className={cn(
        "-mr-2 focus-ring inline-flex min-h-10 items-center gap-2 px-2 text-muted-foreground text-sm leading-5 tracking-[0.017em] transition-colors duration-150 ease-out hover:text-foreground motion-reduce:transition-none",
        className
      )}
      onClick={handleCopy}
      type="button"
    >
      <span aria-hidden="true" className="grid size-4.5 flex-none">
        {icons.map(({ Icon, key, shown }) => (
          <Icon
            className={cn(ICON_BASE, shown ? "opacity-100" : "opacity-0")}
            key={key}
          />
        ))}
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
