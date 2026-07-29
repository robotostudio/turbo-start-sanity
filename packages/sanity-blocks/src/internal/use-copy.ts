"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const COPY_RESET_MS = 1500;

export type CopyStatus = "idle" | "copied" | "error";

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
