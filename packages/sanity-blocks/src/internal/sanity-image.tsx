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

// Normalize a Sanity image ref to its canonical asset id, or null when it's
// missing/malformed. Selecting an asset via the media library can prepend a
// stray `drafts.` prefix (assets have no draft/published split); strip it and
// reject anything that still isn't a full `image-…` ref so a malformed value
// degrades to nothing instead of throwing "Could not parse image ID". Exported
// so callers gate on the exact same validity as SanityImage.
export function resolveAssetId(
  image: SanityImageData | null | undefined
): string | null {
  if (!image?.id || typeof image.id !== "string") {
    return null;
  }
  const id = image.id.replace(/^drafts\./, "");
  return SANITY_ASSET_ID.test(id) ? id : null;
}

export function SanityImage({ image, ...props }: SanityImageProps) {
  const id = resolveAssetId(image);
  if (!(id && image)) {
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
