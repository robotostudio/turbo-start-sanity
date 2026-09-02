"use client";

import { cn } from "@workspace/tailwind-config/utils";
import { Check } from "lucide-react";

import { CopyIcon } from "./icons";
import {
  COPY_STATUS_CLASS,
  SWAP_HIDDEN,
  SWAP_LAYER,
  SWAP_SHOWN,
  useCopyToClipboard,
} from "./use-copy";

export function CopyButton({ code }: Readonly<{ code: string }>) {
  const { status, copy } = useCopyToClipboard(() => code);
  const copied = status === "copied";

  return (
    // The name stays put and the outcome is announced separately: a name that
    // changes under a focused element is only sometimes re-read, and swapping
    // it mid-interaction also renames the control for voice input.
    <button
      aria-label="Copy code to clipboard"
      className={cn(
        "focus-ring inline-flex shrink-0 items-center justify-center rounded-none p-1 text-muted-foreground transition-colors hover:text-foreground",
        COPY_STATUS_CLASS[status]
      )}
      onClick={copy}
      type="button"
    >
      <span aria-hidden="true" className="grid size-4 place-items-center">
        <Check
          className={cn(
            SWAP_LAYER,
            "size-4",
            copied ? SWAP_SHOWN : SWAP_HIDDEN
          )}
        />
        <CopyIcon
          className={cn(
            SWAP_LAYER,
            "size-4",
            copied ? SWAP_HIDDEN : SWAP_SHOWN
          )}
        />
      </span>
      <output className="sr-only">{copied ? "Copied to clipboard" : ""}</output>
    </button>
  );
}
