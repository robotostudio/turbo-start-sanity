import { Logger } from "@workspace/logger";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageBuilder } from "@/components/pagebuilder";
import { client } from "@/lib/sanity/client";
import { sanityFetch } from "@/lib/sanity/live";
import { querySlugPageData, querySlugPagePaths } from "@/lib/sanity/query";
import { getSEOMetadata } from "@/lib/seo";

const logger = new Logger("PageSlug");

async function fetchSlugPageData(slug: string, stega = true) {
  return await sanityFetch({
    query: querySlugPageData,
    params: { slug: `/${slug}` },
    stega,
  });
}

async function fetchSlugPagePaths() {
  try {
    const slugs = await client.fetch(querySlugPagePaths);

    // If no slugs found, return empty array to prevent build errors
    if (!Array.isArray(slugs) || slugs.length === 0) {
      return [];
    }

    const paths: { slug: string[] }[] = [];
    for (const slug of slugs) {
      if (!slug) {
        continue;
      }
      const parts = slug.split("/").filter(Boolean);
      paths.push({ slug: parts });
    }
    return paths;
  } catch (error) {
    logger.error("Error fetching slug paths", error);
    // Return empty array to allow build to continue
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata | undefined> {
  const { slug } = await params;
  const slugString = slug.join("/");
  const { data: pageData } = await fetchSlugPageData(slugString, false);

  if (!pageData) {
    return getSEOMetadata({
      title: "Page Not Found",
      description: "The page you are looking for does not exist.",
      slug: slugString,
      contentId: undefined,
      contentType: undefined,
      seoNoIndex: true,
    }); // Return empty metadata for not found pages
  }

  // Type guard: check if pageData is a "page" type (has title)
  if (pageData._type === "page" || pageData._type === "collection") {
    return getSEOMetadata({
      title: pageData.title ?? "",
      description: pageData.description ?? "",
      slug: pageData.slug,
      contentId: pageData._id,
      contentType: pageData._type,
    });
  }
}

export async function generateStaticParams() {
  const paths = await fetchSlugPagePaths();
  return paths;
}

// Allow dynamic params for paths not generated at build time
export const dynamicParams = true;

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugString = slug.join("/");
  const { data: pageData } = await fetchSlugPageData(slugString);

  if (!pageData) {
    return notFound();
  }

  const { pageBuilder, _id, _type } = pageData;
  // Type guard: only access title if it's a "page" type
  const title = pageData._type === "page" ? pageData.title : undefined;

  return !Array.isArray(pageBuilder) || pageBuilder?.length === 0 ? (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-4 font-semibold text-2xl capitalize">
        {title ?? "Page"}
      </h1>
      <p className="mb-6 text-muted-foreground">
        This page has no content blocks yet.
      </p>
    </div>
  ) : (
    <PageBuilder id={_id} pageBuilder={pageBuilder} type={_type} />
  );
}
