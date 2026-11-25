import Link from "next/link";
import type { ReactNode } from "react";

import { BlogList } from "@/components/blog-list";
import type { Blog } from "@/types";

type BlogSearchResultsProps = Readonly<{
  categoryLabel: string | null;
  clearHref: string;
  results: Blog[];
  searchQuery: string;
}>;

function Term({ children }: Readonly<{ children: string }>) {
  return <span className="text-foreground">“{children}”</span>;
}

function SearchResultsHeader({
  query,
  categoryLabel,
  count,
}: Readonly<{
  query: string;
  categoryLabel: string | null;
  count: number;
}>) {
  return (
    <div className="grid gap-1">
      <h2 className="text-balance font-normal text-2xl tracking-tight">
        Search results for <Term>{query}</Term>
        {categoryLabel ? ` in ${categoryLabel}` : null}
      </h2>
      <p className="text-muted-foreground text-sm tabular-nums">
        {count === 0
          ? "No articles found"
          : `${count} article${count === 1 ? "" : "s"} found`}
      </p>
    </div>
  );
}

function StateFrame({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="grid h-full place-content-center justify-items-center gap-8 py-16 text-center">
      {children}
    </div>
  );
}

const ACTION_CLASS =
  "focus-ring inline-flex min-h-11 w-max shrink-0 items-center rounded-none border border-foreground px-3 font-mono text-foreground text-sm uppercase tracking-wide transition-colors hover:bg-foreground hover:text-background";

function EmptySearchState({
  query,
  categoryLabel,
  clearHref,
}: Readonly<{
  query: string;
  categoryLabel: string | null;
  clearHref: string;
}>) {
  return (
    <>
      <div className="grid gap-6">
        <SearchResultsHeader
          categoryLabel={categoryLabel}
          count={0}
          query={query}
        />
        <p className="max-w-[70ch] text-pretty text-foreground">
          We couldn&rsquo;t find any articles matching <Term>{query}</Term>
          {categoryLabel ? ` in ${categoryLabel}` : null}. Try adjusting your
          search terms.
        </p>
      </div>
      <Link className={ACTION_CLASS} href={clearHref}>
        Clear search
      </Link>
    </>
  );
}

export function BlogSearchResults({
  categoryLabel,
  clearHref,
  results,
  searchQuery,
}: BlogSearchResultsProps) {
  if (results.length === 0) {
    return (
      <section className="min-h-full">
        <StateFrame>
          <EmptySearchState
            categoryLabel={categoryLabel}
            clearHref={clearHref}
            query={searchQuery}
          />
        </StateFrame>
      </section>
    );
  }

  return (
    <section className="mt-8 grid gap-6">
      <SearchResultsHeader
        categoryLabel={categoryLabel}
        count={results.length}
        query={searchQuery}
      />
      <BlogList blogs={results} />
    </section>
  );
}
