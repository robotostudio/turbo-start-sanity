import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  previewForceDrafts,
  sanityFetch,
  sanityFetchMetadata,
} from "@workspace/sanity/live";
import { queryHomePageData } from "@workspace/sanity/query";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { Suspense } from "react";

import { PageBuilderJsonLd } from "@/components/page-builder-json-ld";
import { PageBuilder } from "@/components/pagebuilder";
import { getSEOMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = await getDynamicFetchOptions();
  const { data: homePageData } = await sanityFetchMetadata({
    query: queryHomePageData,
    perspective,
  });
  return getSEOMetadata({
    title: homePageData?.title ?? homePageData?.seoTitle,
    description: homePageData?.description ?? homePageData?.seoDescription,
    ogDescription: homePageData?.ogDescription,
    slug: "/",
    contentId: homePageData?._id,
    contentType: homePageData?._type,
  });
}

export default function Page() {
  // Non-async + Suspense-first so Next prerenders/prefetches a static shell and
  // streams the content. Reading draftMode() at the top would make the whole
  // route dynamic, leaving nothing for <Link> to prefetch — the navigation jank.
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const { isEnabled: isDraftMode } = await draftMode();
  if (isDraftMode || previewForceDrafts) {
    const { perspective, stega } = await getDynamicFetchOptions();
    return <CachedHome perspective={perspective} stega={stega} />;
  }
  return <CachedHome perspective="published" stega={false} />;
}

async function CachedHome({ perspective, stega }: DynamicFetchOptions) {
  "use cache";
  const { data: homePageData } = await sanityFetch({
    query: queryHomePageData,
    perspective,
    stega,
  });

  if (!homePageData) {
    return <div>No home page data</div>;
  }

  const { _id, _type, pageBuilder } = homePageData ?? {};

  return (
    <>
      <PageBuilderJsonLd pageBuilder={pageBuilder} />
      <main className="-mt-16">
        <PageBuilder id={_id} pageBuilder={pageBuilder ?? []} type={_type} />
      </main>
    </>
  );
}

function HomeFallback() {
  return (
    <main className="-mt-16">
      <section className="relative flex min-h-svh animate-pulse flex-col bg-background">
        <div className="relative min-h-[220px] w-full flex-1 overflow-hidden bg-muted" />
        <div className="container mt-8 pb-8 md:mt-10 md:pb-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
            <div className="grid gap-5">
              <div className="h-8 w-32 bg-muted" />
              <div className="grid max-w-[827px] gap-2">
                <div className="h-8 w-full bg-muted sm:h-11 lg:h-[62px]" />
                <div className="h-8 w-3/5 bg-muted sm:h-11 lg:h-[62px]" />
              </div>
              <div className="grid max-w-[633px] gap-2">
                <div className="h-5 w-full bg-muted" />
                <div className="h-5 w-4/5 bg-muted" />
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
