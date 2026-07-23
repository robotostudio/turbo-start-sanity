"use client";

import { cn } from "@workspace/tailwind-config/utils";
import { Check, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CopyLinkIcon } from "@/components/icons";

const RESET_MS = 2000;

type CopyStatus = "idle" | "copied" | "error";

const LABELS: Record<CopyStatus, string> = {
  idle: "Copy as markdown",
  copied: "Copied",
  error: "Copy failed",
};

const ICON_MOTION =
  "col-start-1 row-start-1 size-4.5 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none";
const ICON_SHOWN = "scale-100 opacity-100";
const ICON_HIDDEN = "scale-90 opacity-0";

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
        "-mr-2 focus-ring inline-flex min-h-10 items-center gap-2 px-2 text-muted-foreground text-sm leading-5 tracking-[0.017em] transition-[color,transform] duration-150 ease-out hover:text-foreground active:scale-[0.96] active:duration-[80ms] motion-reduce:transition-none motion-reduce:active:scale-100",
        className
      )}
      onClick={handleCopy}
      type="button"
    >
      <span aria-hidden="true" className="grid size-4.5 flex-none">
        {icons.map(({ Icon, key, shown }) => (
          <Icon
            className={`${ICON_MOTION} ${shown ? ICON_SHOWN : ICON_HIDDEN}`}
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
