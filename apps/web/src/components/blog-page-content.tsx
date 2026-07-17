"use client";

import type { QueryBlogIndexPageDataResult } from "@workspace/sanity/types";
import { useSearchParams } from "next/navigation";

import { BlogHeader, FeaturedBlogCard } from "@/components/blog-card";
import { BlogCategoryFilter } from "@/components/blog-category-filter";
import { BlogList } from "@/components/blog-list";
import { BlogPagination } from "@/components/blog-pagination";
import { BlogSearchResults } from "@/components/blog-search-results";
import { PageBuilder } from "@/components/pagebuilder";
import { useBlogSearch } from "@/hooks/use-blog-search";
import type { Blog } from "@/types";
import type { PaginationMetadata } from "@/utils";
import { SearchInput } from "./blog-search";

type BlogPageContentProps = {
  indexPageData: NonNullable<QueryBlogIndexPageDataResult>;
  blogs: Blog[];
  paginationMetadata: PaginationMetadata;
};

export function BlogPageContent({
  indexPageData,
  blogs,
  paginationMetadata,
}: BlogPageContentProps) {
  const {
    title,
    description,
    pageBuilder = [],
    _id,
    _type,
    displayFeaturedBlogs,
  } = indexPageData;

  const { searchQuery, setSearchQuery, results, isSearching, hasQuery, error } =
    useBlogSearch();

  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const hasCategory = activeCategory.length > 0;

  const shouldDisplayFeaturedBlogs =
    Boolean(displayFeaturedBlogs) &&
    paginationMetadata.currentPage === 1 &&
    !hasQuery &&
    !hasCategory;

  const featuredBlogs = shouldDisplayFeaturedBlogs ? blogs.slice(0, 1) : [];

  const remainingBlogs = shouldDisplayFeaturedBlogs ? blogs.slice(1) : blogs;

  return (
    <main className="bg-background">
      <div className="container my-16">
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
              <BlogCategoryFilter />
            </div>
          </aside>

          <div className="text-foreground">
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

      {pageBuilder && pageBuilder.length > 0 && (
        <div className="pb-16">
          <PageBuilder id={_id} pageBuilder={pageBuilder} type={_type} />
        </div>
      )}
    </main>
  );
}
