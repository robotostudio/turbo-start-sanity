import {
  type DynamicFetchOptions,
  DRAFT_MODE_ENABLED,
  getDynamicFetchOptions,
  resolvePageFetchOptions,
  sanityFetch,
  sanityFetchMetadata,
} from "@workspace/sanity/live";
import { queryHomePageData } from "@workspace/sanity/query";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBuilderJsonLd } from "@/components/page-builder-json-ld";
import { PageBuilder } from "@/components/pagebuilder";
import { HeroFallback } from "@/components/skeletons";
import { seoFromDocument } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = await getDynamicFetchOptions();
  const { data: homePageData } = await sanityFetchMetadata({
    query: queryHomePageData,
    perspective,
  });
  return seoFromDocument(homePageData, { slug: "/" });
}

export default function Page() {
  // Production static-renders published; dev/preview streams drafts below.
  if (!DRAFT_MODE_ENABLED) {
    return <CachedHome perspective="published" stega={false} />;
  }
  return (
    <Suspense fallback={<HeroFallback />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const { perspective, stega } = await resolvePageFetchOptions();
  return <CachedHome perspective={perspective} stega={stega} />;
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
