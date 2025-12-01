"use client";
import Link from "next/link";
import type { PagebuilderType } from "@/types";
import { SanityImage } from "./elements/sanity-image";

export function CollectionCard({
  collection,
}: {
  collection: PagebuilderType<"collectionListing">["collections"][number];
}) {
  if (!collection) {
    return (
      <article className="flex w-full flex-col gap-3">
        <div className="aspect-[4/5] w-full animate-pulse bg-muted" />
        <div className="h-5 w-3/4 animate-pulse bg-muted" />
      </article>
    );
  }

  const { title, slug, image } = collection;

  // Normalize slug to ensure it starts with /
  const normalizedSlug = slug?.startsWith("/") ? slug : slug ? `/${slug}` : "";
  const href = normalizedSlug || "#";

  // Check if we have a valid image with an id
  const hasValidImage = image && typeof image.id === "string" && image.id.length > 0;

  return (
    <article className="flex w-full flex-col gap-3">
      <Link
        className="peer relative block w-full overflow-hidden"
        href={href}
      >
        {hasValidImage ? (
          <SanityImage
            alt={title ?? "Collection image"}
            className="peer aspect-[4/5] w-full object-cover"
            height={500}
            image={image}
            width={400}
          />
        ) : (
          <div className="peer aspect-[4/5] w-full bg-muted" />
        )}
      </Link>
      {title && (
        <Link
          className="peer-hover:!underline peer-hover:!text-accent font-normal text-base decoration-dotted underline-offset-8"
          href={href}
        >
          {title}
        </Link>
      )}
    </article>
  );
}

export function CollectionHeader({
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
