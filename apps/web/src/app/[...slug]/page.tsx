import { Logger } from "@workspace/logger";
import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetch,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@workspace/sanity/live";
import { querySlugPageData, querySlugPagePaths } from "@workspace/sanity/query";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBuilder } from "@/components/pagebuilder";
import { getSEOMetadata } from "@/lib/seo";

const logger = new Logger("PageSlug");

const PLACEHOLDER_SLUG = "__placeholder__";

type SlugParams = { slug: string[] };

export async function generateStaticParams() {
  try {
    const { data: slugs } = await sanityFetchStaticParams({
      query: querySlugPagePaths,
    });

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return [{ slug: [PLACEHOLDER_SLUG] }];
    }

    const paths: SlugParams[] = [];
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
    return [{ slug: [PLACEHOLDER_SLUG] }];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<SlugParams>;
}) {
  const [{ slug }, { perspective }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  const slugString = `/${slug.join("/")}`;
  const { data: pageData } = await sanityFetchMetadata({
    query: querySlugPageData,
    params: { slug: slugString },
    perspective,
  });

  return getSEOMetadata({
    title: pageData?.title ?? pageData?.seoTitle,
    description: pageData?.description ?? pageData?.seoDescription,
    slug: slugString,
    contentId: pageData?._id,
    contentType: pageData?._type,
  });
}

export default async function SlugPage({
  params,
}: {
  params: Promise<SlugParams>;
}) {
  const { isEnabled: isDraftMode } = await draftMode();
  if (isDraftMode) {
    return (
      <Suspense fallback={<SlugFallback />}>
        <DynamicSlugPage params={params} />
      </Suspense>
    );
  }
  const { slug } = await params;
  const pageData = await getCachedSlugPage({
    slug,
    perspective: "published",
    stega: false,
  });
  if (!pageData) {
    notFound();
  }
  return <SlugPageContent pageData={pageData} />;
}

async function DynamicSlugPage({ params }: { params: Promise<SlugParams> }) {
  const [{ slug }, { perspective, stega }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  const pageData = await getCachedSlugPage({ slug, perspective, stega });
  if (!pageData) {
    notFound();
  }
  return <SlugPageContent pageData={pageData} />;
}

// notFound() stays in the non-cached callers above — never inside `'use cache'`.
async function getCachedSlugPage({
  slug,
  perspective,
  stega,
}: SlugParams & DynamicFetchOptions) {
  "use cache";
  const slugString = `/${slug.join("/")}`;
  const { data: pageData } = await sanityFetch({
    query: querySlugPageData,
    params: { slug: slugString },
    perspective,
    stega,
  });
  return pageData;
}

function SlugPageContent({
  pageData,
}: {
  pageData: NonNullable<Awaited<ReturnType<typeof getCachedSlugPage>>>;
}) {
  const { title, pageBuilder, _id, _type } = pageData ?? {};

  return !Array.isArray(pageBuilder) || pageBuilder?.length === 0 ? (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-4 font-semibold text-2xl capitalize">{title}</h1>
      <p className="mb-6 text-muted-foreground">
        This page has no content blocks yet.
      </p>
    </div>
  ) : (
    <PageBuilder id={_id} pageBuilder={pageBuilder} type={_type} />
  );
}

function SlugFallback() {
  return <div className="min-h-[50vh]" />;
}
