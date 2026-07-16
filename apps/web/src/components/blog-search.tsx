"use client";

import { cn } from "@workspace/tailwind-config/utils";
import { Input } from "@workspace/ui/components/input";
import { Search, X } from "lucide-react";

export function SearchInput({
  className,
  placeholder,
  value,
  onChange,
  onClear,
}: {
  className?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className={cn("w-full max-w-sm", className)}>
      <div className="relative">
        <label className="sr-only" htmlFor="blog-search-input">
          {placeholder}
        </label>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground"
          />

          <Input
            className="h-10 rounded-none border-border bg-transparent pr-10 pl-9 text-sm shadow-none"
            id="blog-search-input"
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            value={value}
          />

          {value && (
            <button
              aria-label="Clear search"
              className="focus-ring -translate-y-1/2 absolute top-1/2 right-2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
              onClick={onClear}
              type="button"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
