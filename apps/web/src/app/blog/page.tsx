import { notFound } from "next/navigation";

import { BlogHeader } from "@/components/blog-card";
import { BlogPageContent } from "@/components/blog-page-content";
import { PageBuilder } from "@/components/pagebuilder";
import { sanityFetch } from "@/lib/sanity/live";
import {
  queryBlogIndexPageBlogs,
  queryBlogIndexPageBlogsCount,
  queryBlogIndexPageData,
} from "@/lib/sanity/query";
import { getSEOMetadata } from "@/lib/seo";
import {
  calculatePaginationMetadata,
  getBlogPaginationStartEnd,
  handleErrors,
} from "@/utils";

async function fetchBlogIndexPageData() {
  const res = await sanityFetch({ query: queryBlogIndexPageData });
  return res.data;
}

async function fetchBlogIndexPageBlogs(start: number, end: number) {
  const res = await sanityFetch({
    query: queryBlogIndexPageBlogs,
    params: { start, end },
  });
  return res.data;
}

async function fetchBlogIndexPageBlogsCount() {
  const res = await sanityFetch({
    query: queryBlogIndexPageBlogsCount,
  });
  return res.data;
}

export async function generateMetadata() {
  const { data: result } = await sanityFetch({
    query: queryBlogIndexPageData,
    stega: false,
  });
  return getSEOMetadata(
    result
      ? {
          title: result?.title ?? result?.seoTitle ?? "",
          description: result?.description ?? result?.seoDescription ?? "",
          slug: result?.slug,
          contentId: result?._id,
          contentType: result?._type,
        }
      : {}
  );
}

type BlogPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function BlogIndexPage({ searchParams }: BlogPageProps) {
  const { page } = await searchParams;
  const currentPage = page ? Number(page) : 1;

  // Fetch page data and total count in parallel
  const [[indexPageData, errIndexPageData], [totalCount, errTotalCount]] =
    await Promise.all([
      handleErrors(fetchBlogIndexPageData()),
      handleErrors(fetchBlogIndexPageBlogsCount()),
    ]);

  if (errIndexPageData || !indexPageData) {
    notFound();
  }

  if (errTotalCount || totalCount === null || totalCount === undefined) {
    return (
      <main className="container mx-auto my-16 px-4 md:px-6">
        <BlogHeader
          description={indexPageData.description}
          title={indexPageData.title}
        />
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Unable to load blog posts at the moment.
          </p>
        </div>
        {indexPageData.pageBuilder && indexPageData.pageBuilder.length > 0 && (
          <PageBuilder
            id={indexPageData._id}
            pageBuilder={indexPageData.pageBuilder}
            type={indexPageData._type}
          />
        )}
      </main>
    );
  }

  const featuredBlogsCount = indexPageData.displayFeaturedBlogs
    ? Number(indexPageData.featuredBlogsCount) || 0
    : 0;

  const paginationMetadata = calculatePaginationMetadata(
    totalCount,
    currentPage
  );

  const { start, end } = getBlogPaginationStartEnd(currentPage);
  const blogStart = currentPage === 1 ? 0 : start + featuredBlogsCount;
  const blogEnd =
    currentPage === 1 ? end + featuredBlogsCount : end + featuredBlogsCount;

  const [blogs, errBlogs] = await handleErrors(
    fetchBlogIndexPageBlogs(blogStart, blogEnd)
  );

  if (errBlogs || !blogs) {
    return (
      <main className="container mx-auto my-16 px-4 md:px-6">
        <BlogHeader
          description={indexPageData.description}
          title={indexPageData.title}
        />
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No blog posts available at the moment.
          </p>
        </div>
        {indexPageData.pageBuilder && indexPageData.pageBuilder.length > 0 && (
          <PageBuilder
            id={indexPageData._id}
            pageBuilder={indexPageData.pageBuilder}
            type={indexPageData._type}
          />
        )}
      </main>
    );
  }

  return (
    <BlogPageContent
      blogs={blogs}
      indexPageData={indexPageData}
      paginationMetadata={paginationMetadata}
    />
  );
}
