"use client";

import { cn } from "@workspace/tailwind-config/utils";

import { BlogList } from "@/components/blog-list";
import type { Blog } from "@/types";

type BlogSearchResultsProps = {
  className?: string;
  results: Blog[];
  isSearching: boolean;
  hasQuery: boolean;
  searchQuery: string;
  error?: Error | null;
};

function SearchResultsHeader({
  query,
  count,
}: {
  query: string;
  count: number;
}) {
  return (
    <div className="mb-6 flex flex-col gap-1">
      <h2 className="font-normal text-2xl tracking-tight">
        Search results for “{query}”
      </h2>
      <p className="text-muted-foreground text-sm">
        {count === 0
          ? "No articles found"
          : `${count} article${count === 1 ? "" : "s"} found`}
      </p>
    </div>
  );
}

function EmptySearchState({ query }: { query: string }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto max-w-md">
        <h3 className="mb-2 font-medium text-foreground text-lg">
          No articles found
        </h3>
        <p className="mb-4 text-muted-foreground">
          We couldn't find any articles matching "{query}". Try adjusting your
          search terms.
        </p>
        <div className="text-muted-foreground text-sm">
          <p>Suggestions:</p>
          <ul className="mt-2 space-y-1">
            <li>• Check your spelling</li>
            <li>• Try different keywords</li>
            <li>• Use more general terms</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ query }: { query: string }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto max-w-md">
        <h3 className="mb-2 font-medium text-destructive text-lg">
          Search failed
        </h3>
        <p className="mb-4 text-muted-foreground">
          We encountered an error while searching for "{query}". Please try
          again.
        </p>
        <div className="text-muted-foreground text-sm">
          <p>If the problem persists:</p>
          <ul className="mt-2 space-y-1">
            <li>• Check your internet connection</li>
            <li>• Refresh the page</li>
            <li>• Try again in a few moments</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const LOADING_SKELETONS = [
  "skeleton-1",
  "skeleton-2",
  "skeleton-3",
  "skeleton-4",
  "skeleton-5",
  "skeleton-6",
] as const;

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="mb-2 h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LOADING_SKELETONS.map((id) => (
          <article
            className="flex h-full flex-col gap-4 border border-border p-6"
            key={id}
          >
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-6 w-full animate-pulse rounded bg-muted" />
            <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mt-auto h-6 w-28 animate-pulse rounded bg-muted" />
          </article>
        ))}
      </div>
    </div>
  );
}

export function BlogSearchResults({
  className,
  results,
  isSearching,
  hasQuery,
  searchQuery,
  error,
}: BlogSearchResultsProps) {
  if (!hasQuery) {
    return null;
  }

  if (isSearching) {
    return (
      <section className={cn("mt-8", className)}>
        <LoadingState />
      </section>
    );
  }

  return (
    <section className={cn("mt-8", className)}>
      <SearchResultsHeader count={results.length} query={searchQuery} />

      {error ? (
        <ErrorState query={searchQuery} />
      ) : results.length === 0 ? (
        <EmptySearchState query={searchQuery} />
      ) : (
        <BlogList blogs={results} />
      )}
    </section>
  );
}
