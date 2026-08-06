import {
  DRAFTS_WITHOUT_SESSION,
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  resolvePageFetchOptions,
  sanityFetch,
  sanityFetchMetadata,
} from "@workspace/sanity/live";
import { queryHomePageData } from "@workspace/sanity/query";
import type { Metadata } from "next";
import { draftMode } from "next/headers";

import { PageBuilderJsonLd } from "@/components/page-builder-json-ld";
import { PageBuilder } from "@/components/pagebuilder";
import { seoFromDocument } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = await getDynamicFetchOptions();
  const { data: homePageData } = await sanityFetchMetadata({
    query: queryHomePageData,
    perspective,
  });
  return seoFromDocument(homePageData, { slug: "/" });
}

export default async function Page() {
  const { isEnabled: isDraftMode } = await draftMode();

  // Presentation sessions and local dev stream drafts. No Suspense: draft mode
  // disables `use cache` entirely, so a boundary would always paint its
  // fallback; blocking keeps the previous page on screen, as editors expect.
  if (isDraftMode || DRAFTS_WITHOUT_SESSION) {
    return <HomeContent />;
  }

  return <CachedHome perspective="published" stega={false} />;
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
