import { Logger } from "@workspace/logger";
import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  previewForceDrafts,
  sanityFetch,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@workspace/sanity/live";
import { querySlugPageData, querySlugPagePaths } from "@workspace/sanity/query";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBuilderJsonLd } from "@/components/page-builder-json-ld";
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
}): Promise<Metadata> {
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
    ogDescription: pageData?.ogDescription,
    slug: slugString,
    contentId: pageData?._id,
    contentType: pageData?._type,
  });
}

export default function SlugPage({
  params,
}: Readonly<{ params: Promise<SlugParams> }>) {
  // Non-async + Suspense-first so Next prerenders/prefetches a static shell and
  // streams the content instead of blocking the navigation on the Sanity fetch.
  return (
    <Suspense fallback={<SlugFallback />}>
      <SlugPageInner params={params} />
    </Suspense>
  );
}

async function SlugPageInner({
  params,
}: Readonly<{ params: Promise<SlugParams> }>) {
  const { isEnabled: isDraftMode } = await draftMode();
  const isDraft = isDraftMode || previewForceDrafts;
  const [{ slug }, { perspective, stega }] = await Promise.all([
    params,
    isDraft
      ? getDynamicFetchOptions()
      : Promise.resolve({ perspective: "published" as const, stega: false }),
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

  if (!Array.isArray(pageBuilder) || pageBuilder?.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-4 font-semibold text-2xl capitalize">{title}</h1>
        <p className="mb-6 text-muted-foreground">
          This page has no content blocks yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageBuilderJsonLd pageBuilder={pageBuilder} />
      <main>
        <PageBuilder
          id={_id}
          pageBuilder={pageBuilder}
          pageTitle={title}
          type={_type}
        />
      </main>
    </>
  );
}

function SlugFallback() {
  return (
    <main>
      <section className="relative flex min-h-svh animate-pulse flex-col bg-background">
        <div className="relative min-h-[220px] w-full flex-1 overflow-hidden bg-muted" />
        <div className="container mt-8 pb-8 md:mt-10 md:pb-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
            <div className="grid gap-5">
              <div className="grid max-w-[827px] gap-2">
                <div className="h-8 w-full bg-muted sm:h-11 lg:h-[62px]" />
                <div className="h-8 w-2/3 bg-muted sm:h-11 lg:h-[62px]" />
              </div>
              <div className="grid max-w-[633px] gap-2">
                <div className="h-5 w-full bg-muted" />
                <div className="h-5 w-5/6 bg-muted" />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <div className="h-14 w-full rounded-full bg-muted sm:w-44" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
