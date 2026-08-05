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

type BlogPageProps = Readonly<{
  searchParams: Promise<{
    page?: string;
    category?: string;
  }>;
}>;

export async function generateMetadata({
  searchParams,
}: BlogPageProps): Promise<Metadata> {
  const [{ page, category }, { perspective }] = await Promise.all([
    searchParams,
    getDynamicFetchOptions(),
  ]);
  await assertBlogPageInRange({
    page,
    category: category ?? "",
    perspective,
  });
  const { data: result } = await sanityFetchMetadata({
    query: queryBlogIndexPageData,
    perspective,
  });
  return seoFromDocument(result, { slug: "/blog" });
}

/**
 * `?page=` as a 1-based page number, or `null` when the value is present but
 * not a positive integer — a bogus URL that should 404 rather than quietly
 * serve page 1 under a different address.
 */
function parseBlogPageParam(page: string | undefined): number | null {
  if (page === undefined || page === "") {
    return 1;
  }
  const parsed = Number(page);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * 404s a `?page=` past the last page. Lives in `generateMetadata` because that
 * resolves before the response status is committed; the same `notFound()`
 * inside the page's Suspense boundary only ever streams a soft 404, since PPR
 * has already flushed the prerendered shell with a 200.
 *
 * `totalPages` floors at 1, so page 1 always survives: an empty blog, and an
 * empty category filter, are legitimate results rather than dead URLs.
 */
async function assertBlogPageInRange({
  page,
  category,
  perspective,
}: {
  page: string | undefined;
  category: string;
  perspective: DynamicFetchOptions["perspective"];
}) {
  const currentPage = parseBlogPageParam(page);
  if (currentPage === null) {
    notFound();
  }
  if (currentPage === 1) {
    return;
  }

  const [totalCount] = await handleErrors(
    fetchBlogIndexPageBlogsCount({
      category,
      excludeFeatured: !category,
      perspective,
      stega: false,
    })
  );
  // A failed count is a server problem, not a missing page — let the page
  // render its error state instead of masking it as a 404.
  if (totalCount === null || totalCount === undefined) {
    return;
  }
  const { totalPages } = calculateBlogPaginationMetadata(
    totalCount,
    currentPage
  );
  if (currentPage > totalPages) {
    notFound();
  }
}

export default function BlogIndexPage({ searchParams }: BlogPageProps) {
  return (
    <Suspense fallback={<BlogIndexShell />}>
      <DynamicBlogIndex searchParams={searchParams} />
    </Suspense>
  );
}

async function BlogIndexShell() {
  const [indexPageData] = await handleErrors(
    fetchBlogIndexPageData({ perspective: "published", stega: false })
  );

  if (!indexPageData) {
    return null;
  }

  return (
    <BlogPageContent
      activeCategory=""
      blogs={[]}
      featuredBlogs={[]}
      indexPageData={indexPageData}
      paginationMetadata={{
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 9,
        hasNextPage: false,
        hasPreviousPage: false,
      }}
      pending
    />
  );
}

async function DynamicBlogIndex({ searchParams }: BlogPageProps) {
  const [{ page, category }, { perspective, stega }] = await Promise.all([
    searchParams,
    getDynamicFetchOptions(),
  ]);
  const currentPage = parseBlogPageParam(page);
  if (currentPage === null) {
    notFound();
  }
  const activeCategory = category ?? "";

  // Keyed so a page/category change mounts a *new* boundary. Without it React
  // keeps the previous page's posts on screen for the whole round trip — the
  // URL flips to `?page=2` while the grid still shows page 1.
  return (
    <Suspense
      fallback={<BlogIndexShell />}
      key={`${activeCategory}:${currentPage}`}
    >
      <BlogIndexView
        activeCategory={activeCategory}
        currentPage={currentPage}
        perspective={perspective}
        stega={stega}
      />
    </Suspense>
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

  // Past the last page is a dead URL, not an empty list. `totalPages` floors at
  // 1, so page 1 still renders when there is nothing to show — including an
  // empty category filter, which is a legitimate result rather than a 404.
  if (currentPage > paginationMetadata.totalPages) {
    notFound();
  }

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
