"use client";

import { Check } from "lucide-react";

import { CopyIcon } from "./icons";
import { useCopyToClipboard } from "./use-copy";

export function CopyButton({ code }: Readonly<{ code: string }>) {
  const { status, copy } = useCopyToClipboard(() => code);
  const copied = status === "copied";

  return (
    <button
      aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
      className="focus-ring inline-flex shrink-0 items-center justify-center rounded-none p-1 text-muted-foreground transition-colors hover:text-foreground data-[copied=true]:text-foreground"
      data-copied={copied}
      onClick={copy}
      type="button"
    >
      <span className="grid size-4 place-items-center">
        {copied ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <CopyIcon className="size-4" />
        )}
      </span>
      <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
