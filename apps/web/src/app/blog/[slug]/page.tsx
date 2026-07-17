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

export default function BlogSlugPage({
  params,
}: Readonly<{
  params: Promise<BlogParams>;
}>) {
  // Non-async + Suspense-first so Next prerenders/prefetches a static shell and
  // streams the content instead of blocking the navigation on the Sanity fetch.
  return (
    <Suspense fallback={<BlogFallback />}>
      <BlogSlugInner params={params} />
    </Suspense>
  );
}

async function BlogSlugInner({
  params,
}: Readonly<{ params: Promise<BlogParams> }>) {
  const { isEnabled: isDraftMode } = await draftMode();
  const isDraft = isDraftMode || previewForceDrafts;
  const [{ slug }, { perspective, stega }] = await Promise.all([
    params,
    isDraft
      ? getDynamicFetchOptions()
      : Promise.resolve({ perspective: "published" as const, stega: false }),
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
      <div className="container flex flex-col gap-16 pt-12 pb-24 md:gap-24 md:pt-16">
        <div className="flex flex-col gap-6">
          <nav aria-label="Breadcrumb" className="text-sm">
            <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
              <li>
                <Link
                  className="focus-ring transition-colors hover:text-foreground"
                  href="/"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  className="focus-ring transition-colors hover:text-foreground"
                  href="/blog"
                >
                  Blog
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="min-w-0 text-foreground">
                <span className="block truncate">{title}</span>
              </li>
            </ol>
          </nav>

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
        </div>

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

function BlogFallback() {
  return (
    <main className="bg-background">
      <div className="container flex min-h-[50vh] animate-pulse flex-col gap-16 pt-12 pb-24 md:gap-24 md:pt-16">
        <div className="flex flex-col gap-6">
          <div className="h-5 w-48 bg-muted" />
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="h-10 w-full max-w-3xl bg-muted sm:h-12 lg:h-16" />
              <div className="h-10 w-2/3 max-w-xl bg-muted sm:h-12 lg:h-16" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-56 bg-muted" />
                <div className="h-4 w-64 bg-muted" />
              </div>
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-muted" />
                <div className="h-4 w-28 bg-muted" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-32">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="h-5 w-full bg-muted" />
            <div className="h-5 w-11/12 bg-muted" />
            <div className="h-5 w-full bg-muted" />
            <div className="h-5 w-4/5 bg-muted" />
            <div className="h-5 w-full bg-muted" />
            <div className="h-5 w-3/5 bg-muted" />
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24 bg-grid-dots p-6">
              <div className="flex flex-col gap-4 bg-background p-4">
                <div className="h-5 w-32 bg-muted" />
                <div className="h-4 w-full bg-muted" />
                <div className="h-4 w-5/6 bg-muted" />
                <div className="h-4 w-2/3 bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
