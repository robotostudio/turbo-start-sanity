import { BlogHeader } from "@/components/blog-card";
import { BlogPagination } from "@/components/blog-pagination";
import { BlogSection } from "@/components/blog-section";
import { PageBuilder } from "@/components/pagebuilder";
import type { QueryBlogIndexPageDataResult } from "@/lib/sanity/sanity.types";
import type { Blog } from "@/types";
import type { PaginationMetadata } from "@/utils";

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

  const validFeaturedBlogsCount = featuredBlogsCount
    ? Number.parseInt(featuredBlogsCount, 10)
    : 0;

  const shouldDisplayFeaturedBlogs =
    displayFeaturedBlogs &&
    validFeaturedBlogsCount > 0 &&
    paginationMetadata.currentPage === 1; // Only show featured on first page

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

        <BlogSection blogs={featuredBlogs} isFeatured title="Featured Posts" />

        <BlogSection blogs={remainingBlogs} title="All Posts" />

        <BlogPagination
          className="mt-12 flex justify-center"
          currentPage={paginationMetadata.currentPage}
          hasNextPage={paginationMetadata.hasNextPage}
          hasPreviousPage={paginationMetadata.hasPreviousPage}
          totalPages={paginationMetadata.totalPages}
        />
      </div>

      {pageBuilder && pageBuilder.length > 0 && (
        <PageBuilder id={_id} pageBuilder={pageBuilder} type={_type} />
      )}
    </main>
  );
}
