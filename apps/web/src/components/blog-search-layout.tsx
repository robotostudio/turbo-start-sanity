import { cn } from "@workspace/tailwind-config/utils";
import type { ReactNode } from "react";

import { SearchInput } from "@/components/blog-search";
import { BlogSearchResults } from "@/components/blog-search-results";
import { getBlogCategoryLabel } from "@/lib/blog-categories";
import type { Blog } from "@/types";

type BlogSearchLayoutProps = {
  activeCategory: string;
  categoryFilter: ReactNode;
  featured: ReactNode;
  list: ReactNode;
  searchQuery: string;
  searchResults: Blog[];
  showFeatured: boolean;
};

export function BlogSearchLayout({
  activeCategory,
  categoryFilter,
  featured,
  list,
  searchQuery,
  searchResults,
  showFeatured,
}: Readonly<BlogSearchLayoutProps>) {
  const hasQuery = searchQuery.length > 0;
  const featuredOpen = showFeatured && !hasQuery;
  const isDeadEnd = hasQuery && searchResults.length === 0;
  const categoryLabel = getBlogCategoryLabel(activeCategory);
  const inCategory = categoryLabel ? ` in ${categoryLabel}` : "";
  const plural = searchResults.length === 1 ? "" : "s";
  let searchStatus = "";
  if (isDeadEnd) {
    searchStatus = `No articles found for ${searchQuery}${inCategory}`;
  } else if (hasQuery) {
    searchStatus = `${searchResults.length} article${plural} found for ${searchQuery}${inCategory}`;
  }

  return (
    <>
      {featured ? (
        <section
          aria-label="Featured posts"
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-out in-data-hide-featured:hidden motion-reduce:transition-none",
            featuredOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          )}
          inert={!featuredOpen}
        >
          <div className="-mx-1 min-h-0 overflow-hidden">
            <div className="grid gap-8 px-1 pt-10 pb-1">{featured}</div>
          </div>
        </section>
      ) : null}

      <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="h-max bg-grid-dots p-4 text-zinc-800 lg:sticky lg:top-24 lg:self-start dark:text-zinc-50">
          <div className="flex flex-col gap-6 bg-background p-4">
            <SearchInput
              category={activeCategory}
              className="max-w-none"
              placeholder="Search…"
              query={searchQuery}
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
              categoryLabel={categoryLabel}
              clearHref={
                activeCategory
                  ? `/blog?category=${encodeURIComponent(activeCategory)}`
                  : "/blog"
              }
              results={searchResults}
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
