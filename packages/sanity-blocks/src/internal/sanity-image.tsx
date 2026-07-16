"use client";
import { env } from "@workspace/env/client";
import type { ElementType } from "react";
import {
  SanityImage as BaseSanityImage,
  type WrapperProps,
} from "sanity-image";

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

const ImageWrapper = <T extends ElementType = "img">(
  props: WrapperProps<T>
) => <BaseSanityImage baseUrl={SANITY_BASE_URL} {...props} />;

// A well-formed Sanity image asset id: `image-<assetId>-<width>x<height>-<format>`.
const SANITY_ASSET_ID = /^image-[a-zA-Z0-9]+-\d+x\d+-\w+$/;

export function SanityImage({ image, ...props }: SanityImageProps) {
  if (!image?.id || typeof image.id !== "string") {
    return null;
  }

  // Selecting an existing asset via the media library can write the ref with a
  // stray `drafts.` prefix (assets have no draft/published split), which the
  // image library can't parse. Normalize it back to the real asset id, and bail
  // out on anything that still isn't a valid `image-…` ref so a malformed value
  // degrades to nothing instead of throwing "Could not parse image ID".
  const id = image.id.replace(/^drafts\./, "");
  if (!SANITY_ASSET_ID.test(id)) {
    return null;
  }

  const processedData = {
    id,
    alt: props.alt ?? image.alt ?? "",
    ...(image.preview && { preview: image.preview }),
    ...(image.hotspot && { hotspot: image.hotspot }),
    ...(image.crop && { crop: image.crop }),
  };

  return <ImageWrapper {...props} {...processedData} />;
}
