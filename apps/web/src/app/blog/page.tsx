import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetch,
  sanityFetchMetadata,
} from "@workspace/sanity/live";
import {
  queryBlogIndexPageBlogs,
  queryBlogIndexPageBlogsCount,
  queryBlogIndexPageData,
} from "@workspace/sanity/query";
import type { QueryBlogIndexPageDataResult } from "@workspace/sanity/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BlogHeader } from "@/components/blog-card";
import { BlogPageContent } from "@/components/blog-page-content";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { PageBuilderJsonLd } from "@/components/page-builder-json-ld";
import { PageBuilder } from "@/components/pagebuilder";
import { BlogIndexFallback } from "@/components/skeletons";
import { seoFromDocument } from "@/lib/seo";
import {
  calculateBlogPaginationMetadata,
  getBlogPaginationRange,
  handleErrors,
} from "@/utils";

const BLOG_CRUMBS: readonly Crumb[] = [
  { label: "Home", href: "/" },
  { label: "Blog" },
];

function BlogIndexError({
  indexPageData,
  message,
}: Readonly<{
  indexPageData: NonNullable<QueryBlogIndexPageDataResult>;
  message: string;
}>) {
  return (
    <main className="bg-background">
      <Breadcrumbs crumbs={BLOG_CRUMBS} />
      <div className="container my-16">
        <BlogHeader
          description={indexPageData.description}
          title={indexPageData.title}
        />
        <div className="py-12 text-center">
          <p className="text-muted-foreground">{message}</p>
        </div>
        {indexPageData.pageBuilder && indexPageData.pageBuilder.length > 0 && (
          <>
            <PageBuilderJsonLd pageBuilder={indexPageData.pageBuilder} />
            <PageBuilder
              id={indexPageData._id}
              pageBuilder={indexPageData.pageBuilder}
              type={indexPageData._type}
            />
          </>
        )}
      </div>
    </main>
  );
}

async function fetchBlogIndexPageData({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const res = await sanityFetch({
    query: queryBlogIndexPageData,
    perspective,
    stega,
  });
  return res.data;
}

async function fetchBlogIndexPageBlogs({
  start,
  end,
  category,
  perspective,
  stega,
}: { start: number; end: number; category: string } & DynamicFetchOptions) {
  "use cache";
  const res = await sanityFetch({
    query: queryBlogIndexPageBlogs,
    params: { start, end, category },
    perspective,
    stega,
  });
  return res.data;
}

async function fetchBlogIndexPageBlogsCount({
  category,
  perspective,
  stega,
}: { category: string } & DynamicFetchOptions) {
  "use cache";
  const res = await sanityFetch({
    query: queryBlogIndexPageBlogsCount,
    params: { category },
    perspective,
    stega,
  });
  return res.data;
}

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = await getDynamicFetchOptions();
  const { data: result } = await sanityFetchMetadata({
    query: queryBlogIndexPageData,
    perspective,
  });
  return seoFromDocument(result, { slug: "/blog" });
}

type BlogPageProps = Readonly<{
  searchParams: Promise<{
    page?: string;
    category?: string;
  }>;
}>;

export default function BlogIndexPage({ searchParams }: BlogPageProps) {
  return (
    <Suspense fallback={<BlogIndexFallback />}>
      <DynamicBlogIndex searchParams={searchParams} />
    </Suspense>
  );
}

async function DynamicBlogIndex({ searchParams }: BlogPageProps) {
  const [{ page, category }, { perspective, stega }] = await Promise.all([
    searchParams,
    getDynamicFetchOptions(),
  ]);
  const parsedPage = Number(page);
  const currentPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const activeCategory = category ?? "";

  const [[indexPageData, errIndexPageData], [totalCount, errTotalCount]] =
    await Promise.all([
      handleErrors(fetchBlogIndexPageData({ perspective, stega })),
      handleErrors(
        fetchBlogIndexPageBlogsCount({
          category: activeCategory,
          perspective,
          stega,
        })
      ),
    ]);

  if (errIndexPageData || !indexPageData) {
    notFound();
  }

  if (errTotalCount || totalCount === null || totalCount === undefined) {
    return (
      <BlogIndexError
        indexPageData={indexPageData}
        message="Unable to load blog posts at the moment."
      />
    );
  }

  const hasFeatured =
    Boolean(indexPageData.displayFeaturedBlogs) && !activeCategory;

  const paginationMetadata = calculateBlogPaginationMetadata(
    totalCount,
    currentPage,
    hasFeatured
  );

  const { start: blogStart, end: blogEnd } = getBlogPaginationRange(
    currentPage,
    hasFeatured
  );

  const [blogs, errBlogs] = await handleErrors(
    fetchBlogIndexPageBlogs({
      start: blogStart,
      end: blogEnd,
      category: activeCategory,
      perspective,
      stega,
    })
  );

  if (errBlogs || !blogs) {
    return (
      <BlogIndexError
        indexPageData={indexPageData}
        message="No blog posts available at the moment."
      />
    );
  }

  return (
    <>
      <PageBuilderJsonLd pageBuilder={indexPageData.pageBuilder} />
      <BlogPageContent
        blogs={blogs}
        indexPageData={indexPageData}
        paginationMetadata={paginationMetadata}
      />
    </>
  );
}
