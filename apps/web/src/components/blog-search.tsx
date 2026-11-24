"use client";

import { cn } from "@workspace/tailwind-config/utils";
import { Input } from "@workspace/ui/components/input";
import { LoaderCircle, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState, useTransition } from "react";

import { MAX_SEARCH_LENGTH } from "@/lib/blog-search-query";

function searchHref(query: string, category: string) {
  const params = new URLSearchParams();
  if (category) {
    params.set("category", category);
  }
  if (query) {
    params.set("q", query);
  }
  const search = params.toString();
  return search ? `/blog?${search}` : "/blog";
}

export function SearchInput({
  className,
  placeholder,
  query,
  category,
}: {
  className?: string;
  placeholder: string;
  query: string;
  category: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(query);
  const [lastQuery, setLastQuery] = useState(query);
  const [isSearching, startSearch] = useTransition();

  // useState ignores new props after mount, so copy a new URL q into the box.
  if (query !== lastQuery) {
    setLastQuery(query);
    setValue(query);
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startSearch(() => router.push(searchHref(value.trim(), category)));
  };

  const handleClear = () => {
    setValue("");
    inputRef.current?.focus();
    if (query) {
      startSearch(() => router.push(searchHref("", category)));
    }
  };

  const Icon = isSearching ? LoaderCircle : Search;

  return (
    <form
      action="/blog"
      className={cn("w-full max-w-sm", className)}
      onSubmit={handleSubmit}
    >
      {category ? (
        <input name="category" type="hidden" value={category} />
      ) : null}
      <label className="sr-only" htmlFor="blog-search-input">
        {placeholder}
      </label>

      <div className="relative">
        <Icon
          aria-hidden="true"
          className={cn(
            "-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground",
            isSearching && "animate-spin motion-reduce:animate-none"
          )}
        />

        <Input
          className="h-auto rounded-none border-border bg-transparent py-1.5 pr-10 pl-9.5 text-sm shadow-none"
          enterKeyHint="search"
          id="blog-search-input"
          maxLength={MAX_SEARCH_LENGTH}
          name="q"
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          ref={inputRef}
          value={value}
        />

        {value ? (
          <button
            aria-label="Clear search"
            className="focus-ring -translate-y-1/2 absolute top-1/2 right-2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
            onClick={handleClear}
            type="button"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <output className="sr-only">{isSearching ? "Searching…" : ""}</output>
    </form>
  );
}
