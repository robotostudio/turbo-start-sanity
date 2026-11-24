import { cn } from "@workspace/tailwind-config/utils";
import { Input } from "@workspace/ui/components/input";
import { Search, X } from "lucide-react";
import Form from "next/form";
import Link from "next/link";

const CLEAR_CLASS =
  "focus-ring -translate-y-1/2 absolute top-1/2 right-2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground peer-placeholder-shown:hidden";

export function SearchInput({
  className,
  placeholder,
  defaultValue,
}: {
  className?: string;
  placeholder: string;
  defaultValue: string;
}) {
  return (
    <Form action="/blog" className={cn("w-full max-w-sm", className)}>
      <label className="sr-only" htmlFor="blog-search-input">
        {placeholder}
      </label>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground"
        />

        {/* biome-ignore lint/a11y/noAutofocus: the input remounts after a search, so this keeps keyboard focus in the box */}
        <Input
          autoFocus={defaultValue !== ""}
          className="peer h-auto rounded-none border-border bg-transparent py-1.5 pr-10 pl-9.5 text-sm shadow-none"
          defaultValue={defaultValue}
          enterKeyHint="search"
          id="blog-search-input"
          name="q"
          placeholder={placeholder}
        />

        {defaultValue ? (
          <Link aria-label="Clear search" className={CLEAR_CLASS} href="/blog">
            <X className="size-4" />
          </Link>
        ) : (
          <button
            aria-label="Clear search"
            className={CLEAR_CLASS}
            type="reset"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </Form>
  );
}
