import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetch,
} from "@workspace/sanity/live";
import {
  queryShowcaseItems,
  queryShowcasePageData,
} from "@workspace/sanity/query";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { Suspense } from "react";

import { ShowcasePageContent } from "@/components/showcase-page-content";
import { getSEOMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getSEOMetadata({
    title: "Showcase",
    description:
      "Real sites, real traffic — every site here started from the same Turbo Start Sanity template you're about to run.",
    slug: "/showcase",
  });
}

export default async function ShowcasePage() {
  const { isEnabled: isDraftMode } = await draftMode();
  if (isDraftMode) {
    return (
      <Suspense fallback={<ShowcaseFallback />}>
        <DynamicShowcase />
      </Suspense>
    );
  }
  return <CachedShowcase perspective="published" stega={false} />;
}

async function DynamicShowcase() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedShowcase perspective={perspective} stega={stega} />;
}

async function CachedShowcase({ perspective, stega }: DynamicFetchOptions) {
  "use cache";
  const [{ data: showcaseData }, { data: showcaseItems }] = await Promise.all([
    sanityFetch({
      query: queryShowcasePageData,
      perspective,
      stega,
    }),
    sanityFetch({
      query: queryShowcaseItems,
      perspective,
      stega,
    }),
  ]);

  return <ShowcasePageContent data={showcaseData} items={showcaseItems} />;
}

function ShowcaseFallback() {
  return <main className="container min-h-[50vh] py-16" />;
}
