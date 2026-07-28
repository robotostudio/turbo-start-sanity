import { Logger } from "@workspace/logger";
import {
  type DynamicFetchOptions,
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

export default function SlugPage({
  params,
}: Readonly<{ params: Promise<SlugParams> }>) {
  return (
    <Suspense fallback={<HeroFallback />}>
      <SlugPageInner params={params} />
    </Suspense>
  );
}

async function SlugPageInner({
  params,
}: Readonly<{ params: Promise<SlugParams> }>) {
  const [{ slug }, { perspective, stega }] = await Promise.all([
    params,
    resolvePageFetchOptions(),
  ]);
  const pageData = await getCachedSlugPage({ slug, perspective, stega });
  if (!pageData) {
    notFound();
  }
  return <SlugPageContent pageData={pageData} />;
}

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
