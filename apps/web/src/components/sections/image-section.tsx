"use client";

import { stegaClean } from "next-sanity";

import type { PagebuilderType } from "@/types";

import { SanityImage } from "../elements/sanity-image";

type ImageSectionProps = PagebuilderType<"imageSection">;

export function ImageSection({ image, styleVariant, alt }: ImageSectionProps) {
  if (!image) {
    return null;
  }

  const cleanStyleVariant = stegaClean(styleVariant);
  const isFullBleed = cleanStyleVariant === "fullBleed";

  return (
    <section
      className={
        isFullBleed
          ? "-mx-4 md:-mx-8 relative w-full max-w-screen"
          : "container mx-auto px-4"
      }
    >
      <div className={isFullBleed ? "w-full max-w-screen" : "w-full"}>
        <SanityImage
          alt={alt || undefined}
          className="h-auto w-full object-cover"
          height={1200}
          image={image}
          width={1920}
        />
      </div>
    </section>
  );
}
