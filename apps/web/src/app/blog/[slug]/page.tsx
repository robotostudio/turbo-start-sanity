import { Logger } from "@workspace/logger";
import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  previewForceDrafts,
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
import { draftMode } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TableOfContent } from "@/components/elements/table-of-content";
import { ArticleJsonLd } from "@/components/json-ld";
import { getSEOMetadata } from "@/lib/seo";

const logger = new Logger("BlogSlug");

const PLACEHOLDER_SLUG = "__placeholder__";

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
  return getSEOMetadata({
    title: data?.title ?? data?.seoTitle,
    description: data?.description ?? data?.seoDescription,
    ogDescription: data?.ogDescription,
    slug: slugString,
    contentId: data?._id,
    contentType: data?._type,
    pageType: "article",
  });
}

export default async function BlogSlugPage({
  params,
}: {
  params: Promise<BlogParams>;
}) {
  const { isEnabled: isDraftMode } = await draftMode();
  if (isDraftMode || previewForceDrafts) {
    return (
      <Suspense fallback={<BlogFallback />}>
        <DynamicBlogPage params={params} />
      </Suspense>
    );
  }
  const { slug } = await params;
  const data = await getCachedBlogPage({
    slug,
    perspective: "published",
    stega: false,
  });
  if (!data) {
    notFound();
  }
  return <BlogPageContent data={data} />;
}

async function DynamicBlogPage({ params }: { params: Promise<BlogParams> }) {
  const [{ slug }, { perspective, stega }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  const data = await getCachedBlogPage({ slug, perspective, stega });
  if (!data) {
    notFound();
  }
  return <BlogPageContent data={data} />;
}

// notFound() stays in the non-cached callers above — never inside `'use cache'`.
async function getCachedBlogPage({
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

function formatDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function BlogPageContent({
  data,
}: {
  data: NonNullable<Awaited<ReturnType<typeof getCachedBlogPage>>>;
}) {
  const { title, richText, publishedAt, _updatedAt } = data ?? {};
  const author = data?.authors;
  const publishedDate = formatDate(publishedAt);
  const updatedDate = formatDate(_updatedAt);

  return (
    <main className="bg-background">
      <ArticleJsonLd article={data} />
      <div className="container flex flex-col gap-16 pt-12 pb-20 md:gap-24 md:pt-16">
        <div className="flex flex-col gap-6">
          <nav aria-label="Breadcrumb" className="text-sm tracking-[0.01em]">
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground">
              <li>
                <Link className="focus-ring hover:text-foreground" href="/">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link className="focus-ring hover:text-foreground" href="/blog">
                  Blog
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="line-clamp-1 text-foreground/90">{title}</li>
            </ol>
          </nav>

          <header className="flex flex-col gap-6">
            <h1 className="max-w-[52rem] text-balance font-normal text-4xl tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.1]">
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
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-20">
          <article className="min-w-0">
            <RichText
              className="prose-lg"
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

function BlogFallback() {
  return <div className="min-h-[50vh]" />;
}
