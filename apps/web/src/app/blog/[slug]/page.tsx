import { notFound } from "next/navigation";

import { RichText } from "@/components/elements/rich-text";
import { SanityImage } from "@/components/elements/sanity-image";
import { TableOfContent } from "@/components/elements/table-of-content";
import { ArticleJsonLd } from "@/components/json-ld";
import { client } from "@/lib/sanity/client";
import { sanityFetch } from "@/lib/sanity/live";
import { queryBlogPaths, queryBlogSlugPageData } from "@/lib/sanity/query";
import { getSEOMetadata } from "@/lib/seo";

async function fetchBlogSlugPageData(slug: string, stega = true) {
  return await sanityFetch({
    query: queryBlogSlugPageData,
    params: { slug: `/blog/${slug}` },
    stega,
  });
}

async function fetchBlogPaths() {
  try {
    const slugs = await client.fetch(queryBlogPaths);

    // If no slugs found, return empty array to prevent build errors
    if (!Array.isArray(slugs) || slugs.length === 0) {
      return [];
    }

    const paths: { slug: string }[] = [];
    for (const slug of slugs) {
      if (!slug) {
        continue;
      }
      const [, , path] = slug.split("/");
      if (path) {
        paths.push({ slug: path });
      }
    }
    return paths;
  } catch (error) {
    console.error("Error fetching blog paths:", error);
    // Return empty array to allow build to continue
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await fetchBlogSlugPageData(slug, false);
  return getSEOMetadata(
    data
      ? {
          title: data?.title ?? data?.seoTitle ?? "",
          description: data?.description ?? data?.seoDescription ?? "",
          slug: data?.slug,
          contentId: data?._id,
          contentType: data?._type,
          pageType: "article",
        }
      : {}
  );
}

export async function generateStaticParams() {
  const paths = await fetchBlogPaths();
  return paths;
}

// Allow dynamic params for paths not generated at build time
export const dynamicParams = true;

export default async function BlogSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await fetchBlogSlugPageData(slug);
  if (!data) {
    return notFound();
  }
  const { title, description, image, richText } = data ?? {};

  return (
    <div className="container mx-auto my-16 px-4 md:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <main>
          <ArticleJsonLd article={data} />
          <header className="mb-8">
            <h1 className="mt-2 font-bold text-4xl">{title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          </header>
          {image && (
            <div className="mb-12">
              <SanityImage
                alt={title}
                className="h-auto w-full rounded-lg"
                height={900}
                image={image}
                loading="eager"
                width={1600}
              />
            </div>
          )}
          <RichText richText={richText} />
        </main>

        <div className="hidden lg:block">
          <div className="sticky top-4 rounded-lg">
            <TableOfContent richText={richText ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
}
