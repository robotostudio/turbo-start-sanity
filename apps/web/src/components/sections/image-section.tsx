"use client";

import { ViewportImage } from "@repo/ui/components/ViewportImage";
import { cn } from "@repo/ui/lib/utils";
import { stegaClean } from "next-sanity";

import { urlFor } from "@/lib/sanity/client";
import type { PagebuilderType } from "@/types";
import { SanityImage } from "../elements/sanity-image";

type ImageSectionProps = PagebuilderType<"imageSection">;

export function ImageSection({ image, styleVariant, alt }: ImageSectionProps) {
  if (!image) {
    return null;
  }

  const cleanStyleVariant = stegaClean(styleVariant);

  const isFullBleed = cleanStyleVariant === "fullBleed";
  const isFullViewport = cleanStyleVariant === "fullViewport";
  const isDefault = cleanStyleVariant === "default";
  const isInset = cleanStyleVariant === "inset";

  return (
    <section
      className={cn({
        "relative w-full max-w-screen": isFullBleed,
        "fixed inset-0 z-0 h-full w-full": isFullViewport,
        "container mx-auto px-4": isDefault,
        "container-narrow": isInset,
      })}
    >
      {isFullViewport ? (
        <ViewportImage src={urlFor(image).url()} alt={""} />
      ) : (
        <div className={isFullBleed ? "w-full max-w-screen" : "w-full"}>
          <SanityImage
            alt={alt || undefined}
            className="h-auto w-full object-cover"
            height={1200}
            image={image}
            width={1920}
          />
        </div>
      )}
    </section>
  );
}
