import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";

import { BlogCardSkeleton } from "@/components/skeletons";
import { getBlogCategoryLabel } from "@/lib/blog-categories";
import type { Blog } from "@/types";
import { formatDate } from "@/utils";

type BlogImageProps = {
  image: Blog["image"];
  title?: string | null;
  className?: string;
};

function BlogImage({ image, title, className }: Readonly<BlogImageProps>) {
  if (!image?.id) {
    return null;
  }

  return (
    <SanityImage
      alt={title ?? "Blog post"}
      className={cn(
        "absolute inset-0 size-full rounded-none object-cover",
        className
      )}
      height={600}
      image={image}
      width={800}
    />
  );
}

type BlogCardProps = {
  blog: Blog;
};

function BlogDate({
  publishedAt,
  className,
}: Readonly<{
  publishedAt: string | null;
  className?: string;
}>) {
  const formatted = formatDate(publishedAt);

  if (!formatted) {
    return null;
  }

  return (
    <time
      className={cn("text-sm text-zinc-800 dark:text-zinc-200", className)}
      dateTime={publishedAt ?? ""}
    >
      {formatted}
    </time>
  );
}

function BlogAuthor({
  author,
  className,
}: Readonly<{ author: Blog["authors"]; className?: string }>) {
  if (!author?.name) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {author.image?.id ? (
        <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          <SanityImage
            alt={author.name}
            className="h-full w-full object-cover"
            height={24}
            image={author.image}
            width={24}
          />
        </span>
      ) : (
        <span className="size-6 shrink-0 rounded-full bg-muted" />
      )}
      <span className="text-sm text-zinc-700 dark:text-zinc-300">
        {author.name}
      </span>
    </div>
  );
}

function BlogCategoryTag({ category }: Readonly<{ category?: string | null }>) {
  const label = getBlogCategoryLabel(category);

  if (!label) {
    return null;
  }

  return (
    <span className="text-sm text-zinc-700 capitalize dark:text-zinc-300">
      {label}
    </span>
  );
}

function BlogMeta({
  publishedAt,
  category,
}: Readonly<{
  publishedAt: string | null;
  category?: string | null;
}>) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <BlogDate publishedAt={publishedAt} />
      <BlogCategoryTag category={category} />
    </div>
  );
}

export function FeaturedBlogCard({ blog }: BlogCardProps) {
  const { title, publishedAt, slug, description, image, authors, category } =
    blog ?? {};

  return (
    <article className="hover-surface group focus-ring-within relative grid grid-cols-1 border border-border lg:grid-cols-2">
      <div className="flex flex-col justify-between gap-10 p-6 sm:p-8">
        <BlockEyebrow eyebrow="Featured" />
        <div className="grid gap-4">
          <BlogMeta category={category} publishedAt={publishedAt} />
          <h2 className="text-balance font-normal text-3xl leading-tight tracking-tight sm:text-4xl">
            <Link className="outline-none" href={slug ?? "#"}>
              <span className="absolute inset-0 z-10" />
              {title}
            </Link>
          </h2>
          {description ? (
            <p className="body-text text-muted-foreground">{description}</p>
          ) : null}
          <BlogAuthor author={authors} />
        </div>
      </div>
      <div className="relative order-first min-h-[240px] overflow-hidden border-border border-b lg:order-last lg:min-h-full lg:border-b-0 lg:border-s">
        <BlogImage image={image} title={title} />
      </div>
    </article>
  );
}

export function BlogCard({ blog }: BlogCardProps) {
  if (!blog) {
    return <BlogCardSkeleton />;
  }

  const { title, publishedAt, slug, description, authors, category } = blog;

  return (
    <article className="hover-surface group focus-ring-within relative flex flex-col gap-4 border border-border p-6">
      <BlogMeta category={category} publishedAt={publishedAt} />
      <div className="flex flex-col gap-3">
        <h3 className="font-normal text-2xl text-zinc-900 leading-[34px] dark:text-zinc-50">
          <Link className="outline-none" href={slug ?? "#"}>
            <span className="absolute inset-0 z-10" />
            {title}
          </Link>
        </h3>
        {description ? (
          <p className="body-text line-clamp-3 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <BlogAuthor author={authors} className="mt-auto" />
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
    <div className="grid gap-6">
      <h1 className="text-balance font-normal text-4xl tracking-tight sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="body-text max-w-2xl text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
