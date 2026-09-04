"use client";
import { env } from "@workspace/env/client";
import { cn } from "@workspace/tailwind-config/utils";
import type { ElementType } from "react";
import {
  SanityImage as BaseSanityImage,
  buildSrc,
  buildSrcSet,
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

// Build the URL for the ORIGINAL SVG asset on the CDN, or null when the id
// isn't an SVG. The `sanity-image` lib emits width-based `?w=…` srcsets, which
// makes the CDN rasterize an SVG into a low-res bitmap that then upscales
// (visible pixelation). For SVG sources we skip that pipeline and point a plain
// <img> at the untransformed file: `image-<hash>-<w>x<h>-svg` →
// `${SANITY_BASE_URL}<hash>-<w>x<h>.svg` (drop the `image-` prefix, swap the
// trailing `-svg` for `.svg`).
export function svgUrlFromAssetId(id: string | null): string | null {
  if (!id?.endsWith("-svg")) {
    return null;
  }
  const filename = `${id.replace(/^image-/, "").replace(/-svg$/, "")}.svg`;
  return `${SANITY_BASE_URL}${filename}`;
}

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

// Extract the pixel dimensions Sanity encodes in an asset id
// (`image-<hash>-<width>x<height>-<format>`). Returns null when the id is
// missing/malformed. Used to normalize logo sizing by aspect ratio so a wide
// wordmark and a square icon read as the same visual weight (the "logo soup"
// problem) without any extra CMS fields.
export function getImageDimensions(
  image: SanityImageData | null | undefined
): { width: number; height: number; aspectRatio: number } | null {
  const id = resolveAssetId(image);
  if (!id) {
    return null;
  }
  const match = /-(\d+)x(\d+)-/.exec(id);
  if (!match) {
    return null;
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!(width > 0 && height > 0)) {
    return null;
  }
  return { width, height, aspectRatio: width / height };
}

const HOTSPOT_KEYS = ["x", "y"] as const;
const CROP_KEYS = ["top", "bottom", "left", "right"] as const;

// A half-filled hotspot/crop reaches `sanity-image` as NaN and yields a broken
// transform, so anything not fully numeric is dropped.
function isFiniteAll(
  value: unknown,
  keys: readonly string[]
): value is Record<string, number> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return keys.every((key) => Number.isFinite(record[key]));
}

export function SanityImage({ image, ...props }: SanityImageProps) {
  const id = resolveAssetId(image);
  if (!(id && image)) {
    return null;
  }

  // SVG fast-path: render the untransformed vector directly so it stays crisp
  // at any display size. No `data-lqip`, so the global
  // `img[data-lqip]{image-rendering:pixelated}` rule can't touch it, and
  // `object-contain` keeps the logo from being cropped by the global
  // `img{object-fit:cover}`.
  const svgUrl = svgUrlFromAssetId(id);
  if (svgUrl) {
    return (
      // biome-ignore lint/performance/noImgElement: intentional plain <img> to serve the original SVG untouched by the CDN transform pipeline.
      <img
        alt={props.alt ?? image.alt ?? ""}
        className={cn("object-contain", props.className)}
        decoding="async"
        height={props.height}
        loading={props.loading ?? "lazy"}
        src={svgUrl}
        style={props.style}
        width={props.width}
      />
    );
  }

  const processedData = {
    id,
    alt: props.alt ?? image.alt ?? "",
    ...(image.preview && { preview: image.preview }),
    ...(isFiniteAll(image.hotspot, HOTSPOT_KEYS) && { hotspot: image.hotspot }),
    ...(isFiniteAll(image.crop, CROP_KEYS) && { crop: image.crop }),
  };

  // The sanity-image lib hides the real <img> (opacity:0) until an onLoad
  // handler reveals it, so a preview image never appears without JS.
  // NoScriptFallback renders a plain, correctly-sized <img> for that case; the
  // global `img[data-lqip]{display:none}` no-JS rule hides the lib placeholder.
  return (
    <>
      <ImageWrapper {...props} {...processedData} />
      {image.preview ? (
        <NoScriptFallback
          alt={processedData.alt}
          crop={processedData.crop}
          hotspot={processedData.hotspot}
          id={id}
          imgProps={props}
        />
      ) : null}
    </>
  );
}

// Plain <img> shown only with JS off, reusing the caller's layout props and the
// same URL builder the lib uses, so crop/hotspot framing matches the JS render.
function NoScriptFallback({
  alt,
  crop,
  hotspot,
  id,
  imgProps,
}: Readonly<{
  alt: string;
  crop?: SanityImageData["crop"];
  hotspot?: SanityImageData["hotspot"];
  id: string;
  imgProps: Omit<WrapperProps<"img">, "id">;
}>) {
  const query = {
    baseUrl: SANITY_BASE_URL,
    id,
    width: typeof imgProps.width === "number" ? imgProps.width : undefined,
    height: typeof imgProps.height === "number" ? imgProps.height : undefined,
    mode: imgProps.mode,
    ...(hotspot && { hotspot }),
    ...(crop && { crop }),
  };
  return (
    <noscript>
      {/* biome-ignore lint/performance/noImgElement: no-JS fallback; next/image needs JS. */}
      <img
        alt={alt}
        className={imgProps.className}
        height={imgProps.height}
        loading={imgProps.loading}
        sizes={imgProps.sizes}
        src={buildSrc(query).src}
        srcSet={buildSrcSet(query).join(", ")}
        style={imgProps.style}
        width={imgProps.width}
      />
    </noscript>
  );
}
