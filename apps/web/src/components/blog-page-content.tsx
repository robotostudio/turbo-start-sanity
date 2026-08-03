"use client";

import type { QueryBlogIndexPageDataResult } from "@workspace/sanity/types";
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
  paginationMetadata: PaginationMetadata;
  // Resolved server-side so this client island doesn't read `useSearchParams`.
  activeCategory: string;
  // Server-rendered page builder passed as children, kept out of this bundle.
  children?: ReactNode;
};

export function BlogPageContent({
  indexPageData,
  blogs,
  paginationMetadata,
  activeCategory,
  children,
}: BlogPageContentProps) {
  const { title, description, displayFeaturedBlogs } = indexPageData;

  const { searchQuery, setSearchQuery, results, isSearching, hasQuery, error } =
    useBlogSearch();

  const hasCategory = activeCategory.length > 0;

  const shouldDisplayFeaturedBlogs =
    Boolean(displayFeaturedBlogs) &&
    paginationMetadata.currentPage === 1 &&
    !hasQuery &&
    !hasCategory;

  const featuredBlogs = shouldDisplayFeaturedBlogs ? blogs.slice(0, 1) : [];

  const remainingBlogs = shouldDisplayFeaturedBlogs ? blogs.slice(1) : blogs;

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

        {featuredBlogs.length > 0 && (
          <section aria-label="Featured posts" className="mt-10 grid gap-8">
            {featuredBlogs.map((blog) => (
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

          <div className="text-foreground">
            <output className="sr-only">{searchStatus}</output>
            {hasQuery ? (
              <BlogSearchResults
                error={error}
                hasQuery={hasQuery}
                isSearching={isSearching}
                results={results}
                searchQuery={searchQuery}
              />
            ) : (
              <>
                <BlogList blogs={remainingBlogs} />
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
