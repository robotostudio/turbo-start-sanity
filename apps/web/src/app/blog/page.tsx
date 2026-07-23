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
import {
  Breadcrumbs,
  BreadcrumbsSkeleton,
  type Crumb,
} from "@/components/breadcrumbs";
import { PageBuilderJsonLd } from "@/components/page-builder-json-ld";
import { PageBuilder } from "@/components/pagebuilder";
import { getSEOMetadata } from "@/lib/seo";
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

function CategorySkeleton() {
  return <div className="h-5 w-20 bg-muted" />;
}

function BlogCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 border border-border p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="h-5 w-24 bg-muted" />
        <div className="h-5 w-16 bg-muted" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="grid gap-2">
          <div className="h-[26px] w-full bg-muted" />
          <div className="h-[26px] w-2/3 bg-muted" />
        </div>
        <div className="grid gap-2">
          <div className="h-5 w-full bg-muted" />
          <div className="h-5 w-full bg-muted" />
          <div className="h-5 w-4/5 bg-muted" />
        </div>
      </div>
      <div className="mt-auto flex items-center gap-2">
        <div className="size-6 rounded-full bg-muted" />
        <div className="h-5 w-24 bg-muted" />
      </div>
    </div>
  );
}

function BlogIndexFallback() {
  return (
    <main className="bg-background">
      <BreadcrumbsSkeleton />
      <div className="container my-16 animate-pulse">
        <div className="grid gap-6">
          <div className="h-10 w-full max-w-md bg-muted sm:h-12" />
          <div className="grid max-w-2xl gap-2">
            <div className="h-5 w-full bg-muted" />
            <div className="h-5 w-3/4 bg-muted" />
          </div>
        </div>

        <div className="mt-10 grid gap-8">
          <div className="grid grid-cols-1 border border-border lg:grid-cols-2">
            <div className="flex flex-col justify-between gap-10 p-6 sm:p-8">
              <div className="h-8 w-28 bg-muted" />
              <div className="grid gap-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="h-5 w-24 bg-muted" />
                  <div className="h-5 w-16 bg-muted" />
                </div>
                <div className="grid gap-2">
                  <div className="h-7 w-full bg-muted sm:h-9" />
                  <div className="h-7 w-3/4 bg-muted sm:h-9" />
                </div>
                <div className="grid gap-2">
                  <div className="h-5 w-full bg-muted" />
                  <div className="h-5 w-5/6 bg-muted" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-muted" />
                  <div className="h-5 w-24 bg-muted" />
                </div>
              </div>
            </div>
            <div className="order-first min-h-[240px] border-border border-b bg-muted lg:order-last lg:min-h-full lg:border-b-0 lg:border-s" />
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <div className="h-max bg-grid-dots p-4 lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-col gap-6 bg-background p-4">
              <div className="h-[34px] w-full bg-muted" />
              <div className="grid gap-2">
                <CategorySkeleton />
                <CategorySkeleton />
                <CategorySkeleton />
                <CategorySkeleton />
                <CategorySkeleton />
                <CategorySkeleton />
                <CategorySkeleton />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <BlogCardSkeleton />
            <BlogCardSkeleton />
            <BlogCardSkeleton />
            <BlogCardSkeleton />
            <BlogCardSkeleton />
            <BlogCardSkeleton />
          </div>
        </div>
      </div>
    </main>
  );
}
