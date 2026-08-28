"use client";

import { cn } from "@workspace/tailwind-config/utils";
import type { ReactNode } from "react";

import { SearchInput } from "@/components/blog-search";
import { BlogSearchResults } from "@/components/blog-search-results";
import { useBlogSearch } from "@/hooks/use-blog-search";

type BlogSearchLayoutProps = {
  categoryFilter: ReactNode;
  featured: ReactNode;
  list: ReactNode;
};

export function BlogSearchLayout({
  categoryFilter,
  featured,
  list,
}: Readonly<BlogSearchLayoutProps>) {
  const { searchQuery, setSearchQuery, results, isSearching, hasQuery, error } =
    useBlogSearch();

  const isDeadEnd =
    hasQuery && !isSearching && (Boolean(error) || results.length === 0);

  const searchStatus = (() => {
    if (!hasQuery) {
      return "";
    }
    if (isSearching) {
      return "Searching…";
    }
    if (error) {
      return "Search failed";
    }
    if (results.length === 0) {
      return `No articles found for ${searchQuery}`;
    }
    const plural = results.length === 1 ? "" : "s";
    return `${results.length} article${plural} found for ${searchQuery}`;
  })();

  return (
    <>
      {featured && !hasQuery ? (
        <section aria-label="Featured posts" className="mt-10 grid gap-8">
          {featured}
        </section>
      ) : null}

      <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="h-max bg-grid-dots p-4 text-zinc-800 lg:sticky lg:top-24 lg:self-start dark:text-zinc-50">
          <div className="flex flex-col gap-6 bg-background p-4">
            <SearchInput
              className="max-w-none"
              onChange={setSearchQuery}
              onClear={() => setSearchQuery("")}
              placeholder="Search…"
              value={searchQuery}
            />
            {categoryFilter}
          </div>
        </aside>

        <div
          className={cn(
            "grid text-foreground",
            isDeadEnd ? "lg:h-0 lg:min-h-full" : "content-start"
          )}
        >
          <output className="sr-only">{searchStatus}</output>
          {hasQuery ? (
            <BlogSearchResults
              error={error}
              hasQuery={hasQuery}
              isSearching={isSearching}
              onClear={() => setSearchQuery("")}
              results={results}
              searchQuery={searchQuery}
            />
          ) : (
            list
          )}
        </div>
      </div>
    </>
  );
}
