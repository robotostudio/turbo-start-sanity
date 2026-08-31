import type { QueryBlogIndexPageResult } from "@workspace/sanity/types";
import type { ReactNode } from "react";

import { BlogHeader, FeaturedBlogCard } from "@/components/blog-card";
import { BlogCategoryFilter } from "@/components/blog-category-filter";
import { BlogList } from "@/components/blog-list";
import { BlogPagination } from "@/components/blog-pagination";
import { BlogSearchLayout } from "@/components/blog-search-layout";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { Blog } from "@/types";
import type { PaginationMetadata } from "@/utils";

type BlogPageContentProps = {
  indexPageData: NonNullable<QueryBlogIndexPageResult>;
  blogs: Blog[];
  // Already excluded from `blogs` by the query, so the two never overlap.
  featuredBlogs: Blog[];
  paginationMetadata: PaginationMetadata;
  activeCategory: string;
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

  const showFeatured =
    paginationMetadata.currentPage === 1 && featuredBlogs.length > 0;

  return (
    <main className="bg-background">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      <div className="container mt-8 mb-16 md:my-16">
        <BlogHeader description={description} title={title} />

        <BlogSearchLayout
          categoryFilter={
            <BlogCategoryFilter activeCategory={activeCategory} />
          }
          featured={
            showFeatured
              ? featuredBlogs.map((blog) => (
                  <FeaturedBlogCard blog={blog} key={blog._id} />
                ))
              : null
          }
          list={
            <>
              <BlogList blogs={blogs} />
              {paginationMetadata.totalPages > 1 && (
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
          }
        />
      </div>

      {children}
    </main>
  );
}
