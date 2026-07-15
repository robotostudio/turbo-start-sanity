import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";

import { getBlogCategoryLabel } from "@/lib/blog-categories";
import type { Blog } from "@/types";

type BlogImageProps = {
  image: Blog["image"];
  title?: string | null;
  className?: string;
};

function BlogImage({ image, title, className }: BlogImageProps) {
  if (!image?.id) {
    return null;
  }

  return (
    <SanityImage
      alt={title ?? "Blog post image"}
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

function formatBlogDate(publishedAt: string | null) {
  if (!publishedAt) {
    return "";
  }

  return new Date(publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function BlogDate({
  publishedAt,
  className,
}: {
  publishedAt: string | null;
  className?: string;
}) {
  const formatted = formatBlogDate(publishedAt);

  if (!formatted) {
    return null;
  }

  return (
    <time
      className={cn("text-foreground text-sm", className)}
      dateTime={publishedAt ?? ""}
    >
      {formatted}
    </time>
  );
}

function BlogAuthor({ author }: { author: Blog["authors"] }) {
  if (!author?.name) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
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
      <span className="text-muted-foreground text-sm">{author.name}</span>
    </div>
  );
}

function BlogCategoryTag({ category }: { category?: string | null }) {
  const label = getBlogCategoryLabel(category);

  if (!label) {
    return null;
  }

  return <span className="text-muted-foreground text-sm">{label}</span>;
}

function BlogMeta({
  publishedAt,
  category,
}: {
  publishedAt: string | null;
  category?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <BlogDate publishedAt={publishedAt} />
      <BlogCategoryTag category={category} />
    </div>
  );
}

function FeaturedBadge() {
  return (
    <div className="inline-flex items-center gap-2 self-start rounded-sm border border-border px-3 py-1.5">
      <span className="size-2 rounded-[1px] bg-accent-green" />
      <span className="font-light font-mono text-foreground text-sm uppercase tracking-wide">
        Featured
      </span>
    </div>
  );
}

export function FeaturedBlogCard({ blog }: BlogCardProps) {
  const { title, publishedAt, slug, description, image, authors, category } =
    blog ?? {};

  return (
    <article className="group relative grid grid-cols-1 border border-border lg:grid-cols-2">
      <div className="flex flex-col justify-between gap-10 p-6 sm:p-8">
        <FeaturedBadge />
        <div className="flex flex-col gap-4">
          <BlogMeta category={category} publishedAt={publishedAt} />
          <h2 className="text-balance font-normal text-3xl leading-tight tracking-tight sm:text-4xl">
            <Link
              className="focus-ring transition-colors group-hover:text-muted-foreground"
              href={slug ?? "#"}
            >
              <span className="absolute inset-0" />
              {title}
            </Link>
          </h2>
          {description ? (
            <p className="text-base text-muted-foreground leading-6">
              {description}
            </p>
          ) : null}
          <BlogAuthor author={authors} />
        </div>
      </div>
      <div className="relative order-first min-h-[240px] overflow-hidden border-border border-b lg:order-last lg:min-h-full lg:border-b-0 lg:border-l">
        <BlogImage image={image} title={title} />
      </div>
    </article>
  );
}

export function BlogCard({ blog }: BlogCardProps) {
  if (!blog) {
    return (
      <article className="flex h-full flex-col gap-4 border border-border p-6">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-6 w-full animate-pulse rounded bg-muted" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-auto h-6 w-28 animate-pulse rounded bg-muted" />
      </article>
    );
  }

  const { title, publishedAt, slug, description, authors, category } = blog;

  return (
    <article className="group relative flex h-full flex-col gap-4 border border-border p-6 transition-colors hover:border-muted-foreground/40">
      <BlogMeta category={category} publishedAt={publishedAt} />
      <div className="flex flex-1 flex-col gap-3">
        <h3 className="font-normal text-2xl leading-8">
          <Link
            className="focus-ring transition-colors group-hover:text-muted-foreground"
            href={slug ?? "#"}
          >
            <span className="absolute inset-0" />
            {title}
          </Link>
        </h3>
        {description ? (
          <p className="line-clamp-3 text-muted-foreground text-sm leading-5">
            {description}
          </p>
        ) : null}
      </div>
      <BlogAuthor author={authors} />
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
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm">
          <li>
            <Link
              className="focus-ring text-muted-foreground transition-colors hover:text-foreground"
              href="/"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground">
            /
          </li>
          <li className="text-foreground">Blog</li>
        </ol>
      </nav>
      <h1 className="text-balance font-normal text-4xl tracking-tight sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-lg text-muted-foreground leading-8">
          {description}
        </p>
      ) : null}
    </div>
  );
}
