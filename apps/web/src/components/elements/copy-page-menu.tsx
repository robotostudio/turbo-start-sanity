"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  FileTextIcon,
} from "lucide-react";
import { useCallback, useState } from "react";

interface CopyPageMenuProps {
  markdownPath: string;
}

export function CopyPageMenu({ markdownPath }: CopyPageMenuProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      const res = await fetch(markdownPath);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may not be available */
    }
  }, [markdownPath]);

  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-background">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-l-lg px-3 py-1 text-sm text-primary/85 transition-colors hover:bg-muted"
      >
        {copied ? (
          <CheckIcon strokeWidth={1.5} className="size-4 text-green-500" />
        ) : (
          <CopyIcon strokeWidth={1.5} className="size-4" />
        )}
        <span className="relative grid items-center justify-items-start">
          <span className="invisible col-start-1 row-start-1">Copy page</span>
          <span className="invisible col-start-1 row-start-1">Copied!</span>
          <span className="col-start-1 row-start-1">
            {copied ? "Copied!" : "Copy page"}
          </span>
        </span>
      </button>

      <span className="w-px self-stretch bg-border" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center rounded-r-lg px-2 py-2 text transition-colors hover:bg-muted focus:outline-none"
          >
            <ChevronDownIcon strokeWidth={1.5} className="size-3.5" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          alignOffset={10}
          sideOffset={10}
          className="w-72 rounded-xl p-1.5"
        >
          <DropdownMenuItem
            onClick={handleCopy}
            className="flex cursor-pointer items-start gap-3 rounded-lg"
          >
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
              <CopyIcon strokeWidth={1.5} className="!size-5 text-muted-foreground" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Copy page</span>
              <span className="block text-xs text-muted-foreground">
                Copy page as Markdown for LLMs
              </span>
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            asChild
            className="flex cursor-pointer items-start gap-3 rounded-lg"
          >
            <a href={markdownPath} target="_blank" rel="noopener noreferrer">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                <FileTextIcon
                  strokeWidth={1.5}
                  className="!size-5 text-muted-foreground"
                />
              </span>
              <span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold">
                  View as Markdown
                  <ArrowUpRightIcon strokeWidth={1.5} className="!size-3.5" />
                </span>
                <span className="block text-xs text-muted-foreground">
                  View this page as plain text
                </span>
              </span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
