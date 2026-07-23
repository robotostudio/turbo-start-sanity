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
        <div className="relative min-h-0 flex-1 overflow-hidden bg-muted" />
        <div className="container mt-8 pb-8 md:mt-10 md:pb-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
            <div className="grid gap-5">
              <div className="grid max-w-[827px] text-4xl sm:text-5xl lg:text-[64px]">
                <div className="h-[1.1em] w-full bg-muted bg-clip-content py-[0.12em]" />
                <div className="h-[1.1em] w-2/3 bg-muted bg-clip-content py-[0.12em]" />
                <div className="h-[1.1em] w-1/3 bg-muted bg-clip-content py-[0.12em] sm:hidden" />
              </div>
              <div className="body-text grid max-w-[633px]">
                <div className="h-[1lh] w-full bg-muted bg-clip-content py-[0.2lh]" />
                <div className="h-[1lh] w-4/5 bg-muted bg-clip-content py-[0.2lh]" />
                <div className="h-[1lh] w-3/5 bg-muted bg-clip-content py-[0.2lh] lg:hidden" />
                <div className="h-[1lh] w-2/5 bg-muted bg-clip-content py-[0.2lh] sm:hidden" />
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
