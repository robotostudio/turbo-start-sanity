"use client";

import { BlogHeader } from "@/components/blog-card";
import { BlogPagination } from "@/components/blog-pagination";
import { BlogSearchResults } from "@/components/blog-search-results";
import { BlogSection } from "@/components/blog-section";
import { PageBuilder } from "@/components/pagebuilder";
import { SearchFilters } from "@/components/search-filters";
import { useBlogSearch } from "@/hooks/use-blog-search";
import type { QueryBlogIndexPageDataResult } from "@/lib/sanity/sanity.types";
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
    featuredBlogsCount,
    displayFeaturedBlogs,
  } = indexPageData;

  const {
    searchQuery,
    setSearchQuery,
    results,
    total,
    isSearching,
    hasQuery,
    error,
    facets,
    filters,
    setCategoryFilter,
    setAuthorFilter,
    setDateFilter,
    clearFilters,
    source,
  } = useBlogSearch();

  const validFeaturedBlogsCount = featuredBlogsCount
    ? Number.parseInt(featuredBlogsCount, 10)
    : 0;

  const shouldDisplayFeaturedBlogs =
    displayFeaturedBlogs &&
    validFeaturedBlogsCount > 0 &&
    paginationMetadata.currentPage === 1 &&
    !hasQuery;

  const featuredBlogs = shouldDisplayFeaturedBlogs
    ? blogs.slice(0, validFeaturedBlogsCount)
    : [];

  const remainingBlogs = shouldDisplayFeaturedBlogs
    ? blogs.slice(validFeaturedBlogsCount)
    : blogs;

  return (
    <main className="bg-background">
      <div className="container mx-auto my-16 px-4 md:px-6">
        <BlogHeader description={description} title={title} />

        <SearchInput
          className="mt-8 mb-4"
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
          placeholder="Search blogs..."
          value={searchQuery}
        />

        {hasQuery && (
          <SearchFilters
            className="mb-8"
            facets={facets}
            filters={filters}
            onCategoryChange={setCategoryFilter}
            onAuthorChange={setAuthorFilter}
            onDateChange={setDateFilter}
            onClearFilters={clearFilters}
          />
        )}

        {hasQuery ? (
          <BlogSearchResults
            error={error}
            hasQuery={hasQuery}
            isSearching={isSearching}
            results={results}
            searchQuery={searchQuery}
            total={total}
            source={source}
          />
        ) : (
          <>
            <BlogSection
              blogs={featuredBlogs}
              isFeatured
              title="Featured Posts"
            />
            <BlogSection blogs={remainingBlogs} title="All Posts" />
            {paginationMetadata?.totalPages > 1 && (
              <BlogPagination
                className="mt-12 flex justify-center"
                currentPage={paginationMetadata.currentPage}
                hasNextPage={paginationMetadata.hasNextPage}
                hasPreviousPage={paginationMetadata.hasPreviousPage}
                totalPages={paginationMetadata.totalPages}
              />
            )}
          </>
        )}
      </div>

      {pageBuilder && pageBuilder.length > 0 && (
        <PageBuilder id={_id} pageBuilder={pageBuilder} type={_type} />
      )}
    </main>
  );
}
