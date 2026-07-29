import { Logger } from "@workspace/logger";
import {
  type DynamicFetchOptions,
  DRAFT_MODE_ENABLED,
  getDynamicFetchOptions,
  resolvePageFetchOptions,
  sanityFetch,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@workspace/sanity/live";
import { querySlugPageData, querySlugPagePaths } from "@workspace/sanity/query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageBuilderJsonLd } from "@/components/page-builder-json-ld";
import { PageBuilder } from "@/components/pagebuilder";
import { HeroFallback } from "@/components/skeletons";
import { seoFromDocument } from "@/lib/seo";
import { PLACEHOLDER_SLUG } from "@/utils";

const logger = new Logger("PageSlug");

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

  return seoFromDocument(pageData, { slug: slugString });
}

export default async function SlugPage({
  params,
}: Readonly<{ params: Promise<SlugParams> }>) {
  // Dev/preview: draft-aware path so unpublished pages still render.
  if (DRAFT_MODE_ENABLED) {
    return (
      <Suspense fallback={<HeroFallback />}>
        <SlugPageInner params={params} />
      </Suspense>
    );
  }
  // Production: static published render with a real 404, no skeleton.
  const { slug } = await params;
  const pageData = await getPublishedSlugPage(slug);
  if (!pageData) {
    notFound();
  }
  return <SlugPageContent pageData={pageData} />;
}

// Cached published fetch; a miss lets the caller return a real 404.
async function getPublishedSlugPage(slug: string[]) {
  "use cache";
  const slugString = `/${slug.join("/")}`;
  const { data: pageData } = await sanityFetch({
    query: querySlugPageData,
    params: { slug: slugString },
    perspective: "published",
    stega: false,
  });
  return pageData;
}

type SlugPageData = NonNullable<
  Awaited<ReturnType<typeof getPublishedSlugPage>>
>;

async function SlugPageInner({
  params,
}: Readonly<{ params: Promise<SlugParams> }>) {
  const [{ slug }, { perspective, stega }] = await Promise.all([
    params,
    resolvePageFetchOptions(),
  ]);
  const pageData = await getDraftSlugPage({ slug, perspective, stega });
  if (!pageData) {
    notFound();
  }
  return <SlugPageContent pageData={pageData} />;
}

async function getDraftSlugPage({
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

function SlugPageContent({ pageData }: Readonly<{ pageData: SlugPageData }>) {
  const { title, pageBuilder, _id, _type } = pageData ?? {};

  if (!Array.isArray(pageBuilder) || pageBuilder.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-4 font-semibold text-2xl capitalize">{title}</h1>
        <p className="mb-6 text-muted-foreground">
          This page has no content blocks yet.
        </p>
      </div>
    );
  }

  const hasLeadingHero = pageBuilder[0]?._type === "hero";

  return (
    <>
      <PageBuilderJsonLd pageBuilder={pageBuilder} />
      {hasLeadingHero ? null : (
        <Breadcrumbs
          crumbs={[{ label: "Home", href: "/" }, { label: title }]}
        />
      )}
      <main className={hasLeadingHero ? "-mt-16" : undefined}>
        <PageBuilder id={_id} pageBuilder={pageBuilder} type={_type} />
      </main>
    </>
  );
}
