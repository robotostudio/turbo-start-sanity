import type { QueryBlogIndexPageDataResult } from "@workspace/sanity/types";
import type { ReactNode } from "react";

import { BlogHeader, FeaturedBlogCard } from "@/components/blog-card";
import { BlogCategoryFilter } from "@/components/blog-category-filter";
import { BlogList } from "@/components/blog-list";
import { BlogPagination } from "@/components/blog-pagination";
import { BlogSearchLayout } from "@/components/blog-search-layout";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BlogGridSkeleton } from "@/components/skeletons";
import type { Blog } from "@/types";
import type { PaginationMetadata } from "@/utils";

const BLOG_SHELL_SKELETON_COUNT = 9;

type BlogPageContentProps = {
  indexPageData: NonNullable<QueryBlogIndexPageDataResult>;
  blogs: Blog[];
  // Already excluded from `blogs` by the query, so the two never overlap.
  featuredBlogs: Blog[];
  paginationMetadata: PaginationMetadata;
  activeCategory: string;
  children?: ReactNode;
  pending?: boolean;
};

export function BlogPageContent({
  indexPageData,
  blogs,
  featuredBlogs,
  paginationMetadata,
  activeCategory,
  children,
  pending = false,
}: BlogPageContentProps) {
  const { title, description } = indexPageData;

  const showFeatured =
    !pending &&
    paginationMetadata.currentPage === 1 &&
    featuredBlogs.length > 0;

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
            pending ? (
              <BlogGridSkeleton count={BLOG_SHELL_SKELETON_COUNT} />
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
            )
          }
        />
      </div>

      {children}
    </main>
  );
}
