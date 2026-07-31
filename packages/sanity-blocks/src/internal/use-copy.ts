"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const COPY_RESET_MS = 1500;

export type CopyStatus = "idle" | "loading" | "copied" | "error";

/** Shared so every copy affordance signals the same way, using the ink-tuned
 * status tokens rather than `--accent-green`/`--destructive`, which are tuned
 * as fills and don't hold contrast as text. Failure had no visual at all until
 * now: a failed copy looked exactly like an idle one. */
export const COPY_STATUS_CLASS: Record<CopyStatus, string> = {
  idle: "",
  loading: "",
  // Both hold through hover: without the pair the buttons' own
  // `hover:text-foreground` wins on specificity and wipes the outcome out under
  // the very cursor that triggered the copy.
  copied: "text-success hover:text-success",
  error: "text-danger hover:text-danger",
};

export function useCopyToClipboard(
  getText: () => string | Promise<string>,
  resetMs: number = COPY_RESET_MS
) {
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

  const copy = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setStatus("loading");

    let next: CopyStatus = "error";
    try {
      await navigator.clipboard.writeText(await getText());
      next = "copied";
    } catch {
      next = "error";
    }

    setStatus(next);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setStatus("idle"), resetMs);
    return next;
  }, [getText, resetMs]);

  return { status, copy };
}
