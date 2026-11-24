import { getDynamicFetchOptions } from "@workspace/sanity/live";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BlogPageContent } from "@/components/blog-page-content";
import { PageBuilderJsonLd } from "@/components/page-builder-json-ld";
import { PageBuilder } from "@/components/pagebuilder";
import {
  type BlogIndexPageData,
  fetchBlogIndexPage,
  parseBlogPageParam,
} from "@/lib/blog-index";
import { searchBlogs } from "@/lib/blog-search";
import { seoFromDocument } from "@/lib/seo";
import type { Blog } from "@/types";
import { calculateBlogPaginationMetadata } from "@/utils";

type BlogPageProps = Readonly<{
  searchParams: Promise<{
    page?: string;
    category?: string;
    q?: string;
  }>;
}>;

export async function generateMetadata({
  searchParams,
}: BlogPageProps): Promise<Metadata> {
  const [{ page, category, q }, { perspective }] = await Promise.all([
    searchParams,
    getDynamicFetchOptions(),
  ]);
  const currentPage = parseBlogPageParam(page);
  if (currentPage === null) {
    notFound();
  }

  const data = await fetchBlogIndexPage({
    currentPage,
    category: category ?? "",
    perspective,
    stega: false,
  });
  // No index document is a 404, matching the view's behavior.
  if (!data) {
    notFound();
  }

  // 404 out-of-range pages here, not in the view: metadata resolves before the
  // status commits, while `notFound()` inside the Suspense boundary only
  // streams a soft 404 after PPR flushed a 200 shell. `totalPages` floors at
  // 1, so page 1 of an empty blog or category always survives.
  const { totalPages } = calculateBlogPaginationMetadata(
    data.total,
    currentPage
  );
  if (currentPage > totalPages) {
    notFound();
  }

  const metadata = await seoFromDocument(data, { slug: "/blog" });
  if (q && metadata.robots === "index, follow") {
    metadata.robots = "noindex, follow";
  }
  return metadata;
}

export default function BlogIndexPage({ searchParams }: BlogPageProps) {
  // Deliberately unkeyed: a key would remount the boundary and repaint the
  // fallback on every pagination click; unkeyed, the previous posts stay on
  // screen until the new page resolves, so the fallback only paints on a
  // fresh load.
  return (
    <Suspense fallback={<BlogIndexShell />}>
      <BlogIndexView searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * The static shell: real published page-1 content, no loading state. A deep
 * link like `?page=2` shows page 1 until the right page resolves.
 */
async function BlogIndexShell() {
  const data = await fetchBlogIndexPage({
    currentPage: 1,
    category: "",
    perspective: "published",
    stega: false,
  });

  if (!data) {
    return null;
  }

  return (
    <BlogIndexBody
      activeCategory=""
      currentPage={1}
      data={data}
      searchQuery=""
      searchResults={[]}
    />
  );
}

async function BlogIndexView({ searchParams }: BlogPageProps) {
  const [{ page, category, q }, { perspective, stega }] = await Promise.all([
    searchParams,
    getDynamicFetchOptions(),
  ]);
  const currentPage = parseBlogPageParam(page);
  if (currentPage === null) {
    notFound();
  }
  const activeCategory = category ?? "";
  const searchQuery = q?.trim() ?? "";

  const [data, searchResults] = await Promise.all([
    fetchBlogIndexPage({
      currentPage,
      category: activeCategory,
      perspective,
      stega,
    }),
    searchQuery ? searchBlogs(searchQuery, perspective) : [],
  ]);
  if (!data) {
    notFound();
  }

  // Past the last page is a dead URL, not an empty list — the real 404 status
  // was already sent by `generateMetadata`; this keeps the body consistent.
  const { totalPages } = calculateBlogPaginationMetadata(
    data.total,
    currentPage
  );
  if (currentPage > totalPages) {
    notFound();
  }

  return (
    <BlogIndexBody
      activeCategory={activeCategory}
      currentPage={currentPage}
      data={data}
      searchQuery={searchQuery}
      searchResults={searchResults}
    />
  );
}

function BlogIndexBody({
  data,
  activeCategory,
  currentPage,
  searchQuery,
  searchResults,
}: Readonly<{
  data: BlogIndexPageData;
  activeCategory: string;
  currentPage: number;
  searchQuery: string;
  searchResults: Blog[];
}>) {
  const paginationMetadata = calculateBlogPaginationMetadata(
    data.total,
    currentPage
  );

  return (
    <>
      <PageBuilderJsonLd pageBuilder={data.pageBuilder} />
      <BlogPageContent
        activeCategory={activeCategory}
        blogs={data.blogs}
        featuredBlogs={data.featuredBlogs}
        indexPageData={data}
        paginationMetadata={paginationMetadata}
        searchQuery={searchQuery}
        searchResults={searchResults}
      >
        {data.pageBuilder && data.pageBuilder.length > 0 ? (
          <div className="pb-16">
            <PageBuilder
              id={data._id}
              pageBuilder={data.pageBuilder}
              type={data._type}
            />
          </div>
        ) : null}
      </BlogPageContent>
    </>
  );
}
