"use client";

import {cn} from "@workspace/ui/lib/utils";
import {stegaClean, toPlainText} from "next-sanity";

import type {
  PagebuilderType,
  SanityImageProps,
  SanityRichTextProps,
} from "@/types";
import {RichText} from "../elements/rich-text";
import {SanityImage} from "../elements/sanity-image";

type ImageGalleryProps = PagebuilderType<"imageGallery">;

export function ImageGallery({images, columnVariant}: ImageGalleryProps) {
  if (!images || images.length === 0) {
    return null;
  }

  const cleanColumnVariant = stegaClean(columnVariant);

  return (
    <section className="container">
      <div
        className={cn(
          "grid grid-cols-1 gap-16",
          {
            "md:grid-cols-1 container-narrow": cleanColumnVariant === "single",
            "md:grid-cols-2 container": cleanColumnVariant === "two",
            "md:grid-cols-3 container-wide": cleanColumnVariant === "three",
          },
          cleanColumnVariant
        )}
      >
        {images.map(
          (
            item: NonNullable<ImageGalleryProps["images"]>[number] & {
              alt?: string;
            },
            index: number
          ) => {
            if (!item.image) {
              return null;
            }

            // const cleanVariant = stegaClean(item.variant);

            return (
              <figure className="" key={item._key || index}>
                <div className={cn("w-full overflow-hidden h-auto")}>
                  <SanityImage
                    alt={item.alt || ""}
                    className="h-auto w-full"
                    height={1200}
                    image={item.image as unknown as SanityImageProps}
                    sizes="100vw"
                    width={2000}
                  />
                </div>
                {item.caption &&
                  toPlainText(item.caption).replace(/\s/g, "") !== "" && (
                    <figcaption className="px-4 text-sm md:px-0">
                      <RichText
                        className="caption -mb-4 mt-1"
                        richText={item.caption as SanityRichTextProps}
                      />
                    </figcaption>
                  )}
              </figure>
            );
          }
        )}
      </div>
    </section>
  );
}
