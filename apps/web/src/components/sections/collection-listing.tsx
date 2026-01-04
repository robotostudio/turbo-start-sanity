"use client";

import { cn } from "@repo/ui/lib/utils";
import { stegaClean } from "next-sanity";

import type { PagebuilderType } from "@/types";
import { CollectionCard } from "../collection-card";

type CollectionListingProps = PagebuilderType<"collectionListing">;

export function CollectionListing({
  collections,
  columnVariant,
}: CollectionListingProps) {
  if (!collections || collections.length === 0) {
    return null;
  }

  const cleanColumnVariant = stegaClean(columnVariant);
  const gridClasses = cn("grid gap-8 md:gap-12", {
    "grid-cols-1": cleanColumnVariant === "auto",
    "grid-cols-1 md:grid-cols-2": cleanColumnVariant === "two",
    "grid-cols-1 md:grid-cols-2 lg:grid-cols-3": cleanColumnVariant === "three",
    "grid-cols-1 md:grid-cols-2 lg:grid-cols-4": cleanColumnVariant === "four",
  });

  return (
    <section className="container mx-auto px-4 py-8">
      <div className={gridClasses}>
        {collections.map((collection) => (
          <CollectionCard collection={collection} key={collection._id} />
        ))}
      </div>
    </section>
  );
}
