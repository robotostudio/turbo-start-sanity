"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function CopyButton({ code }: Readonly<{ code: string }>) {
  const [copied, setCopied] = useState(false);
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
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [code]);

  return (
    <button
      aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
      className="focus-ring inline-flex shrink-0 items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground data-[copied=true]:text-foreground"
      data-copied={copied}
      onClick={handleCopy}
      type="button"
    >
      <span className="relative grid size-4 place-items-center">
        <Copy
          aria-hidden="true"
          className={`col-start-1 row-start-1 size-4 transition-[transform,opacity] duration-[250ms] ease-in-out ${
            copied ? "scale-50 opacity-0" : "scale-100 opacity-100"
          }`}
        />
        <Check
          aria-hidden="true"
          className={`col-start-1 row-start-1 size-4 transition-[transform,opacity] duration-[250ms] ease-in-out ${
            copied ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
      </span>
      <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
