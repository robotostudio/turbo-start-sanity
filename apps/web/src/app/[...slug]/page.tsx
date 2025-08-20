import { notFound } from "next/navigation";
import { PageBuilder } from "@/components/pagebuilder";
import { client } from "@/lib/sanity/client";
import { sanityFetch } from "@/lib/sanity/live";
import { querySlugPageData, querySlugPagePaths } from "@/lib/sanity/query";
import { getSEOMetadata } from "@/lib/seo";

async function fetchSlugPageData(slug: string, stega = true) {
  return await sanityFetch({
    query: querySlugPageData,
    params: { slug: `/${slug}` },
    stega,
  });
}

async function fetchSlugPagePaths() {
  const slugs = await client.fetch(querySlugPagePaths);
  return slugs
    .filter(Boolean)
    .map((slug: string) => ({ slug: slug.split("/").filter(Boolean) }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string[] };
}) {
  const slugString = params.slug.join("/");
  const { data: pageData } = await fetchSlugPageData(slugString, false);

  return getSEOMetadata(
    pageData
      ? {
          title: pageData?.title ?? pageData?.seoTitle ?? "",
          description: pageData?.description ?? pageData?.seoDescription ?? "",
          slug: pageData?.slug,
          contentId: pageData?._id,
          contentType: pageData?._type,
        }
      : {},
  );
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  return await fetchSlugPagePaths();
}

export default async function SlugPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const slugString = params.slug.join("/");
  const { data: pageData } = await fetchSlugPageData(slugString);

  if (!pageData) return notFound();

  const { title, pageBuilder, _id, _type } = pageData ?? {};

  return !Array.isArray(pageBuilder) || pageBuilder.length === 0 ? (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
      <h1 className="text-2xl font-semibold mb-4 capitalize">{title}</h1>
      <p className="text-muted-foreground mb-6">
        This page has no content blocks yet.
      </p>
    </div>
  ) : (
    <PageBuilder pageBuilder={pageBuilder} id={_id} type={_type} />
  );
}
