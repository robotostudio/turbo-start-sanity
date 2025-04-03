import { getImageDimensions } from "@sanity/asset-utils";
import { cn } from "@workspace/ui/lib/utils";
import type { ImageProps as NextImageProps } from "next/image";
import { SanityImage as SanityImagePackage } from "sanity-image";

import { dataset, projectId } from "@/lib/sanity/api";
import type { SanityImageProps } from "@/types";

type ImageProps = {
  asset: SanityImageProps;
  alt?: string;
} & Omit<NextImageProps, "alt" | "src">;

export function SanityImage({
  asset,
  alt,
  width,
  height,
  className,
  quality = 75,
  fill,
  priority,
}: ImageProps) {
  if (!asset?.id || !asset?.asset) return null;
  const dimensions = getImageDimensions(asset.asset);

  const imageId = asset.id;

  const hotspot = asset?.hotspot
    ? {
        x: asset?.hotspot?.x ?? 0.5,
        y: asset?.hotspot?.y ?? 0.5,
      }
    : undefined;

  const crop = asset?.crop
    ? {
        bottom: asset?.crop?.bottom ?? 0,
        left: asset?.crop?.left ?? 0,
        right: asset?.crop?.right ?? 0,
        top: asset?.crop?.top ?? 0,
      }
    : undefined;

  return (
    <SanityImagePackage
      className={cn(className)}
      id={imageId}
      projectId={projectId}
      alt={alt ?? asset.alt ?? "Image"}
      aria-label={alt ?? asset.alt ?? "Image"}
      dataset={dataset}
      width={Number(width ?? dimensions.width)}
      height={Number(height ?? dimensions.height)}
      // sizes="(max-width: 640px) 75vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      hotspot={hotspot}
      crop={crop}
      queryParams={{
        fm: "webp",
        q: Number(quality),
      }}
      mode={fill ? "cover" : "contain"}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
