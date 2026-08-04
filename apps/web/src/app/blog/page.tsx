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
  queryBlogIndexPageFeaturedBlogs,
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

async function fetchBlogIndexPageFeaturedBlogs({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const res = await sanityFetch({
    query: queryBlogIndexPageFeaturedBlogs,
    perspective,
    stega,
  });
  return res.data;
}

async function fetchBlogIndexPageBlogs({
  start,
  end,
  category,
  excludeFeatured,
  perspective,
  stega,
}: {
  start: number;
  end: number;
  category: string;
  excludeFeatured: boolean;
} & DynamicFetchOptions) {
  "use cache";
  const res = await sanityFetch({
    query: queryBlogIndexPageBlogs,
    params: { start, end, category, excludeFeatured },
    perspective,
    stega,
  });
  return res.data;
}

async function fetchBlogIndexPageBlogsCount({
  category,
  excludeFeatured,
  perspective,
  stega,
}: { category: string; excludeFeatured: boolean } & DynamicFetchOptions) {
  "use cache";
  const res = await sanityFetch({
    query: queryBlogIndexPageBlogsCount,
    params: { category, excludeFeatured },
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
  // The fallback is the real default view (page 1, unfiltered, published), not a
  // skeleton. Under PPR it prerenders as the static shell, so /blog shows content
  // instantly; the dynamic island below streams in and only changes anything when
  // a `category`/`page` filter is actually present.
  return (
    <Suspense
      fallback={
        <BlogIndexView
          activeCategory=""
          currentPage={1}
          perspective="published"
          stega={false}
        />
      }
    >
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

  return (
    <BlogIndexView
      activeCategory={activeCategory}
      currentPage={currentPage}
      perspective={perspective}
      stega={stega}
    />
  );
}

async function BlogIndexView({
  currentPage,
  activeCategory,
  perspective,
  stega,
}: { currentPage: number; activeCategory: string } & DynamicFetchOptions) {
  const [indexPageData, errIndexPageData] = await handleErrors(
    fetchBlogIndexPageData({ perspective, stega })
  );

  if (errIndexPageData || !indexPageData) {
    notFound();
  }

  // Drives the strip, the list exclusion and the count together — split them
  // and a promoted post is counted twice or paginated into a gap.
  const hasFeatured = !activeCategory;

  const [[totalCount, errTotalCount], [featuredBlogs]] = await Promise.all([
    handleErrors(
      fetchBlogIndexPageBlogsCount({
        category: activeCategory,
        excludeFeatured: hasFeatured,
        perspective,
        stega,
      })
    ),
    handleErrors(
      hasFeatured
        ? fetchBlogIndexPageFeaturedBlogs({ perspective, stega })
        : Promise.resolve([])
    ),
  ]);

  if (errTotalCount || totalCount === null || totalCount === undefined) {
    return (
      <BlogIndexError
        indexPageData={indexPageData}
        message="Unable to load blog posts at the moment."
      />
    );
  }

  const paginationMetadata = calculateBlogPaginationMetadata(
    totalCount,
    currentPage
  );

  const { start: blogStart, end: blogEnd } =
    getBlogPaginationRange(currentPage);

  const [blogs, errBlogs] = await handleErrors(
    fetchBlogIndexPageBlogs({
      start: blogStart,
      end: blogEnd,
      category: activeCategory,
      excludeFeatured: hasFeatured,
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
        activeCategory={activeCategory}
        blogs={blogs}
        featuredBlogs={featuredBlogs ?? []}
        indexPageData={indexPageData}
        paginationMetadata={paginationMetadata}
      >
        {indexPageData.pageBuilder && indexPageData.pageBuilder.length > 0 ? (
          <div className="pb-16">
            <PageBuilder
              id={indexPageData._id}
              pageBuilder={indexPageData.pageBuilder}
              type={indexPageData._type}
            />
          </div>
        ) : null}
      </BlogPageContent>
    </>
  );
}
