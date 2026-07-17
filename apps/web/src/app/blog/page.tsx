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
import { PageBuilderJsonLd } from "@/components/page-builder-json-ld";
import { PageBuilder } from "@/components/pagebuilder";
import { getSEOMetadata } from "@/lib/seo";
import {
  calculateBlogPaginationMetadata,
  getBlogPaginationRange,
  handleErrors,
} from "@/utils";

function BlogIndexError({
  indexPageData,
  message,
}: Readonly<{
  indexPageData: NonNullable<QueryBlogIndexPageDataResult>;
  message: string;
}>) {
  return (
    <main className="container my-16">
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
  return getSEOMetadata({
    title: result?.title ?? result?.seoTitle,
    description: result?.description ?? result?.seoDescription,
    ogDescription: result?.ogDescription,
    slug: "/blog",
    contentId: result?._id,
    contentType: result?._type,
  });
}

type BlogPageProps = {
  searchParams: Promise<{
    page?: string;
    category?: string;
  }>;
};

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

  // A single full-width featured card sits on page 1 only, and never when a
  // category filter is active. It consumes the first document, shifting the
  // list pagination window by one.
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

function BlogIndexFallback() {
  return (
    <main className="bg-background">
      <div className="container my-16 min-h-[50vh] animate-pulse">
        <div className="grid gap-6">
          <div className="h-5 w-32 bg-muted" />
          <div className="h-10 w-full max-w-md bg-muted sm:h-12" />
          <div className="h-5 w-full max-w-2xl bg-muted" />
        </div>

        <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <div className="h-max bg-grid-dots p-4">
            <div className="flex flex-col gap-6 bg-background p-4">
              <div className="h-9 w-full bg-muted" />
              <div className="grid gap-2">
                <div className="h-4 w-full bg-muted" />
                <div className="h-4 w-5/6 bg-muted" />
                <div className="h-4 w-2/3 bg-muted" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {["a", "b", "c", "d", "e", "f"].map((key) => (
              <div
                className="flex h-full flex-col gap-4 border border-border p-6"
                key={key}
              >
                <div className="h-4 w-24 bg-muted" />
                <div className="grid flex-1 content-start gap-3">
                  <div className="h-6 w-full bg-muted" />
                  <div className="h-6 w-2/3 bg-muted" />
                  <div className="h-4 w-full bg-muted" />
                  <div className="h-4 w-5/6 bg-muted" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-muted" />
                  <div className="h-4 w-24 bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
