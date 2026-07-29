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
import { queryBlogPaths, queryBlogSlugPageData } from "@workspace/sanity/query";
import {
  RichText,
  type RichTextValue,
} from "@workspace/sanity-blocks/internal/rich-text";
import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { TableOfContent } from "@/components/elements/table-of-content";
import { ArticleJsonLd } from "@/components/json-ld";
import { BlogFallback } from "@/components/skeletons";
import { seoFromDocument } from "@/lib/seo";
import { formatDate, PLACEHOLDER_SLUG } from "@/utils";

const logger = new Logger("BlogSlug");

type BlogParams = { slug: string };

export async function generateStaticParams() {
  try {
    const { data: slugs } = await sanityFetchStaticParams({
      query: queryBlogPaths,
    });

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return [{ slug: PLACEHOLDER_SLUG }];
    }

    const paths: BlogParams[] = [];
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
    logger.error("Error fetching blog paths", error);
    return [{ slug: PLACEHOLDER_SLUG }];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<BlogParams>;
}): Promise<Metadata> {
  const [{ slug }, { perspective }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  const slugString = `/blog/${slug}`;
  const { data } = await sanityFetchMetadata({
    query: queryBlogSlugPageData,
    params: { slug: slugString },
    perspective,
  });
  return seoFromDocument(data, { slug: slugString, pageType: "article" });
}

export default async function BlogSlugPage({
  params,
}: Readonly<{
  params: Promise<BlogParams>;
}>) {
  // Dev/preview: draft-aware path so unpublished posts still render.
  if (DRAFT_MODE_ENABLED) {
    return (
      <Suspense fallback={<BlogFallback />}>
        <BlogSlugInner params={params} />
      </Suspense>
    );
  }
  // Production: static published render with a real 404, no skeleton.
  const { slug } = await params;
  const data = await getPublishedBlogPage(slug);
  if (!data) {
    notFound();
  }
  return <BlogPageContent data={data} />;
}

// Cached published fetch; a miss lets the caller return a real 404.
async function getPublishedBlogPage(slug: string) {
  "use cache";
  const slugString = `/blog/${slug}`;
  const { data } = await sanityFetch({
    query: queryBlogSlugPageData,
    params: { slug: slugString },
    perspective: "published",
    stega: false,
  });
  return data;
}

type BlogPageData = NonNullable<
  Awaited<ReturnType<typeof getPublishedBlogPage>>
>;

async function BlogSlugInner({
  params,
}: Readonly<{ params: Promise<BlogParams> }>) {
  const [{ slug }, { perspective, stega }] = await Promise.all([
    params,
    resolvePageFetchOptions(),
  ]);
  const data = await getDraftBlogPage({ slug, perspective, stega });
  if (!data) {
    notFound();
  }
  return <BlogPageContent data={data} />;
}

async function getDraftBlogPage({
  slug,
  perspective,
  stega,
}: BlogParams & DynamicFetchOptions) {
  "use cache";
  const slugString = `/blog/${slug}`;
  const { data } = await sanityFetch({
    query: queryBlogSlugPageData,
    params: { slug: slugString },
    perspective,
    stega,
  });
  return data;
}

function BlogPageContent({ data }: Readonly<{ data: BlogPageData }>) {
  const { title, richText, publishedAt, _updatedAt } = data ?? {};
  const author = data?.authors;
  const publishedDate = formatDate(publishedAt);
  const updatedDate = formatDate(_updatedAt);

  return (
    <main className="bg-background">
      <ArticleJsonLd article={data} />
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: title },
        ]}
      />
      <div className="container flex flex-col gap-16 pt-12 pb-24 md:gap-24 md:pt-16">
        <header className="flex flex-col gap-6">
          <h1 className="text-balance font-normal text-4xl tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.1]">
            {title}
          </h1>

          <div className="flex flex-col gap-4">
            <dl className="flex flex-col text-sm">
              {publishedDate && (
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Published At:</dt>
                  <dd className="text-foreground/90">{publishedDate}</dd>
                </div>
              )}
              {updatedDate && (
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Last Updated At:</dt>
                  <dd className="text-foreground/90">{updatedDate}</dd>
                </div>
              )}
            </dl>

            {author?.name && (
              <div className="flex items-center gap-2">
                {author.image?.id && (
                  <span className="inline-block size-6 overflow-hidden rounded-full">
                    <SanityImage
                      alt={author.name}
                      className="size-6 rounded-full object-cover"
                      height={48}
                      image={author.image}
                      width={48}
                    />
                  </span>
                )}
                <span className="text-muted-foreground text-sm">
                  {author.name}
                </span>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-32">
          <article className="min-w-0">
            <RichText
              className="prose-lg prose-p:my-0 prose-p:leading-7 prose-p:tracking-[0.013em] prose-li:leading-7 [&>p+p]:mt-8 [&_blockquote]:border-none [&_blockquote]:bg-grid-dots [&_blockquote]:p-4 [&_blockquote]:font-normal [&_blockquote]:not-italic [&_blockquote]:text-zinc-800 dark:[&_blockquote]:text-zinc-50 [&_blockquote_p]:my-0 [&_blockquote_p]:bg-background [&_blockquote_p]:p-8 [&_blockquote_p]:text-lg [&_blockquote_p]:text-muted-foreground [&_blockquote_p]:leading-7 [&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none [&_blockquote_strong]:font-normal [&_blockquote_strong]:text-foreground"
              richText={richText as RichTextValue}
            />
          </article>

          <div className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContent richText={richText ?? []} shareTitle={title} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
