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
      <main className="-mt-16">
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
    <main className="-mt-16">
      <section className="relative flex min-h-svh animate-pulse flex-col bg-background">
        <div className="relative h-[108vw] flex-1 overflow-hidden bg-muted sm:h-[77vw] lg:h-auto lg:max-h-[calc(100svh-276px)] lg:min-h-[40vw]" />
        <div className="container mt-8 pb-8 md:mt-10 md:pb-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
            <div className="grid gap-5">
              <div className="h-8 w-40 bg-muted" />
              <div className="grid">
                <div className="h-[1.1em] w-full max-w-[827px] bg-muted bg-clip-content py-[0.12em] text-4xl sm:text-5xl lg:text-[64px]" />
                <div className="h-[1.1em] w-2/3 max-w-[827px] bg-muted bg-clip-content py-[0.12em] text-4xl sm:text-5xl lg:text-[64px]" />
              </div>
              <div className="body-text grid max-w-[633px]">
                <div className="h-[1lh] w-full bg-muted bg-clip-content py-[0.2lh]" />
                <div className="h-[1lh] w-full bg-muted bg-clip-content py-[0.2lh]" />
                <div className="h-[1lh] w-full bg-muted bg-clip-content py-[0.2lh]" />
                <div className="h-[1lh] w-full bg-muted bg-clip-content py-[0.2lh]" />
                <div className="h-[1lh] w-5/6 bg-muted bg-clip-content py-[0.2lh]" />
                <div className="h-[1lh] w-full bg-muted bg-clip-content py-[0.2lh] sm:hidden" />
                <div className="h-[1lh] w-3/5 bg-muted bg-clip-content py-[0.2lh] sm:hidden" />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <div className="h-14 w-full rounded-full bg-muted sm:w-44" />
              <div className="h-14 w-full rounded-full bg-muted sm:w-44" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
