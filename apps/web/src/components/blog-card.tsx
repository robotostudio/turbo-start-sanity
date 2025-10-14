"use client";
import Link from "next/link";

import type { QueryBlogIndexPageDataResult } from "@/lib/sanity/sanity.types";

import { SanityImage } from "./elements/sanity-image";

type Blog = NonNullable<
  NonNullable<QueryBlogIndexPageDataResult>["blogs"]
>[number];

type BlogImageProps = {
  image: Blog["image"];
  title?: string | null;
};

function BlogImage({ image, title }: BlogImageProps) {
  if (!image?.id) {
    return null;
  }

  return (
    <SanityImage
      alt={title ?? "Blog post image"}
      className="aspect-[16/9] w-full rounded-2xl bg-gray-100 object-cover sm:aspect-[2/1] lg:aspect-[3/2]"
      height={400}
      image={image}
      width={800}
    />
  );
}

type AuthorImageProps = {
  author: Blog["authors"];
};

function AuthorImage({ author }: AuthorImageProps) {
  if (!author?.image) {
    return null;
  }

  return (
    <SanityImage
      alt={author.name ?? "Author image"}
      className="size-8 flex-none rounded-full bg-gray-50"
      height={40}
      image={author.image}
      width={40}
    />
  );
}

type BlogAuthorProps = {
  author: Blog["authors"];
};

export function BlogAuthor({ author }: BlogAuthorProps) {
  if (!author) {
    return null;
  }

  return (
    <div className="flex items-center gap-x-2.5 font-semibold text-gray-900 text-sm/6">
      <AuthorImage author={author} />
      {author.name}
    </div>
  );
}

type BlogCardProps = {
  blog: Blog;
};

function BlogMeta({ publishedAt }: { publishedAt: string | null }) {
  return (
    <div className="my-4 flex items-center gap-x-4 text-xs">
      <time className="text-muted-foreground" dateTime={publishedAt ?? ""}>
        {publishedAt
          ? new Date(publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : ""}
      </time>
    </div>
  );
}

function BlogContent({
  title,
  slug,
  description,
  isFeatured,
}: {
  title: string | null;
  slug: string | null;
  description: string | null;
  isFeatured?: boolean;
}) {
  const HeadingTag = isFeatured ? "h2" : "h3";
  const headingClasses = isFeatured
    ? "mt-3 text-3xl font-semibold leading-tight"
    : "mt-3 text-lg font-semibold leading-6";

  return (
    <div className="group relative">
      <HeadingTag className={headingClasses}>
        <Link href={slug ?? "#"}>
          <span className="absolute inset-0" />
          {title}
        </Link>
      </HeadingTag>
      <p className="mt-5 text-muted-foreground text-sm leading-6">
        {description}
      </p>
    </div>
  );
}

export function FeaturedBlogCard({ blog }: BlogCardProps) {
  const { title, publishedAt, slug, description, image } = blog ?? {};

  return (
    <article className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
      <BlogImage image={image} title={title} />
      <div className="space-y-6">
        <BlogMeta publishedAt={publishedAt} />
        <BlogContent
          description={description}
          isFeatured
          slug={slug}
          title={title}
        />
      </div>
    </article>
  );
}

export function BlogCard({ blog }: BlogCardProps) {
  if (!blog) {
    return (
      <article className="grid w-full grid-cols-1 gap-4">
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-6 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        </div>
      </article>
    );
  }

  const { title, publishedAt, slug, description, image } = blog;

  return (
    <article className="grid w-full grid-cols-1 gap-4">
      <div className="relative aspect-[16/9] h-auto w-full overflow-hidden rounded-2xl">
        <BlogImage image={image} title={title} />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-gray-900/10 ring-inset" />
      </div>
      <div className="w-full space-y-4">
        <BlogMeta publishedAt={publishedAt} />
        <BlogContent description={description} slug={slug} title={title} />
      </div>
    </article>
  );
}

export function BlogHeader({
  title,
  description,
}: {
  title: string | null;
  description: string | null;
}) {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-bold text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-8">
          {description}
        </p>
      </div>
    </div>
  );
}
