"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path (e.g. insecure context / denied API).
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

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
    const ok = await copyToClipboard(code);
    if (!ok) {
      return;
    }
    setCopied(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
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
          className={`col-start-1 row-start-1 size-4 transition-all duration-200 ease-out ${
            copied ? "scale-50 opacity-0" : "scale-100 opacity-100"
          }`}
        />
        <Check
          aria-hidden="true"
          className={`col-start-1 row-start-1 size-4 transition-all duration-200 ease-out ${
            copied ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
      </span>
      <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
