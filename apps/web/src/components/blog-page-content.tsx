"use client";

import type { QueryBlogIndexPageDataResult } from "@workspace/sanity/types";
import { cn } from "@workspace/tailwind-config/utils";
import type { ReactNode } from "react";

import { BlogHeader, FeaturedBlogCard } from "@/components/blog-card";
import { BlogCategoryFilter } from "@/components/blog-category-filter";
import { BlogList } from "@/components/blog-list";
import { BlogPagination } from "@/components/blog-pagination";
import { SearchInput } from "@/components/blog-search";
import { BlogSearchResults } from "@/components/blog-search-results";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useBlogSearch } from "@/hooks/use-blog-search";
import type { Blog } from "@/types";
import type { PaginationMetadata } from "@/utils";

type BlogPageContentProps = {
  indexPageData: NonNullable<QueryBlogIndexPageDataResult>;
  blogs: Blog[];
  // Already excluded from `blogs` by the query, so the two never overlap.
  featuredBlogs: Blog[];
  paginationMetadata: PaginationMetadata;
  // Resolved server-side so this client island doesn't read `useSearchParams`.
  activeCategory: string;
  // Server-rendered page builder passed as children, kept out of this bundle.
  children?: ReactNode;
};

export function BlogPageContent({
  indexPageData,
  blogs,
  featuredBlogs,
  paginationMetadata,
  activeCategory,
  children,
}: BlogPageContentProps) {
  const { title, description } = indexPageData;

  const { searchQuery, setSearchQuery, results, isSearching, hasQuery, error } =
    useBlogSearch();

  const isDeadEnd =
    hasQuery && !isSearching && (Boolean(error) || results.length === 0);

  // The category filter is resolved server-side; page and search are client
  // state, so they are the only conditions left to check here.
  const visibleFeaturedBlogs =
    paginationMetadata.currentPage === 1 && !hasQuery ? featuredBlogs : [];

  // Typing swaps the whole result column with no announcement. This lives
  // outside the swapped subtree deliberately: a live region has to already be
  // in the DOM when its text changes, and `BlogSearchResults` unmounts.
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
    <main className="bg-background">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      <div className="container mt-8 mb-16 md:my-16">
        <BlogHeader description={description} title={title} />

        {visibleFeaturedBlogs.length > 0 && (
          <section aria-label="Featured posts" className="mt-10 grid gap-8">
            {visibleFeaturedBlogs.map((blog) => (
              <FeaturedBlogCard blog={blog} key={blog._id} />
            ))}
          </section>
        )}

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
              <BlogCategoryFilter activeCategory={activeCategory} />
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
              <>
                <BlogList blogs={blogs} />
                {paginationMetadata?.totalPages > 1 && (
                  <BlogPagination
                    category={activeCategory}
                    className="mt-12"
                    currentPage={paginationMetadata.currentPage}
                    hasNextPage={paginationMetadata.hasNextPage}
                    hasPreviousPage={paginationMetadata.hasPreviousPage}
                    totalPages={paginationMetadata.totalPages}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {children}
    </main>
  );
}
