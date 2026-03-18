"use client";
import { env } from "@workspace/env/client";
import { type ElementType, memo } from "react";
import { SanityImage as BaseSanityImage, type WrapperProps } from "sanity-image";

const SANITY_BASE_URL =
  `https://cdn.sanity.io/images/${env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${env.NEXT_PUBLIC_SANITY_DATASET}/` as const;

export interface SanityImageData {
  id?: string | null;
  alt?: string | null;
  preview?: string | null;
  hotspot?: { x: number; y: number } | null;
  crop?: {
    bottom: number;
    left: number;
    right: number;
    top: number;
  } | null;
}

export type SanityImageProps = {
  image: SanityImageData;
} & Omit<WrapperProps<"img">, "id">;

const ImageWrapper = <T extends ElementType = "img">(props: WrapperProps<T>) => (
  <BaseSanityImage baseUrl={SANITY_BASE_URL} {...props} />
);

function SanityImageUnmemorized({ image, ...props }: SanityImageProps) {
  if (!image?.id || typeof image.id !== "string") {
    return null;
  }

  const processedData = {
    id: image.id,
    alt: image.alt ?? "",
    ...(image.preview && { preview: image.preview }),
    ...(image.hotspot && { hotspot: image.hotspot }),
    ...(image.crop && { crop: image.crop }),
  };

  return <ImageWrapper {...props} {...processedData} />;
}

export const SanityImage = memo(SanityImageUnmemorized);
