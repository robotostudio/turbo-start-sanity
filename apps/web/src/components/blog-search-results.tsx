"use client";

import { cn } from "@workspace/ui/lib/utils";

import { BlogList } from "@/components/blog-list";
import type { Blog } from "@/types";

type BlogSearchResultsProps = {
  className?: string;
  results: Blog[];
  isSearching: boolean;
  hasQuery: boolean;
  searchQuery: string;
  error?: Error | null;
  total: number;
  source?: "opensearch" | "fallback" | null;
};

function SearchResultsHeader({
  query,
  count,
  total,
  source,
}: {
  query: string;
  count: number;
  total: number;
  source?: "opensearch" | "fallback" | null;
}) {
  return (
    <div className="mb-6">
      <h2 className="font-semibold text-lg">Search Results for "{query}"</h2>
      <p className="text-muted-foreground text-sm">
        {total === 0
          ? "No articles found"
          : `${total} article${total === 1 ? "" : "s"} found`}
        {source === "fallback" && (
          <span className="ml-2 text-xs text-amber-500" title="Search is running in limited mode. Some features like fuzzy matching and faceted filters may be unavailable.">
            (limited mode)
          </span>
        )}
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {LOADING_SKELETONS.map((id) => (
          <div className="space-y-4" key={id}>
            <div className="aspect-video animate-pulse rounded-2xl bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-6 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
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
  total,
  source,
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
      <SearchResultsHeader count={results.length} total={total} query={searchQuery} source={source} />

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
