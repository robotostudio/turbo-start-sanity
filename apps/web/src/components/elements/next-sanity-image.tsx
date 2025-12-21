"use client";
import imageUrlBuilder, { type SanityImageSource } from "@sanity/image-url";
import Image, { type ImageProps } from "next/image";
import { memo } from "react";

import { dataset, projectId } from "@/config";
import type { SanityImageProps as SanityImageData } from "@/types";

type Fit = "clip" | "crop" | "fill" | "fillmax" | "max" | "scale" | "min";
type Crop = "center" | "entropy" | "focalpoint";
type Format = "jpg" | "png" | "webp" | "auto";

export type TransformOptions = {
  readonly width?: number;
  readonly height?: number;
  readonly fit?: Fit;
  readonly crop?: Crop;
  readonly rect?: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly quality?: number; // 0-100
  readonly format?: Exclude<Format, "auto">;
  readonly autoFormat?: boolean; // maps to auto=format
  readonly blur?: number; // 0-100
  readonly sharpen?: number | boolean; // boolean -> on
  readonly saturation?: number; // -100 to 100
  readonly dpr?: number; // device pixel ratio
  readonly bg?: string; // e.g. fff or rgb:ffffff
};

// Build a Sanity image URL from `SanityImageData` and transform options
function buildUrl(
  image: SanityImageData,
  opts: TransformOptions,
  widthFromLoader?: number,
  qualityFromLoader?: number
): string {
  const builder = imageUrlBuilder({ projectId, dataset });

  // Create a source compatible with the builder that preserves crop/hotspot
  const source = (
    {
      asset: { _ref: image.id },
      hotspot: image?.hotspot,
      crop: image?.crop,
    } as unknown
  ) as SanityImageSource;

  let chain = builder.image(source);

  chain = applyTransforms(chain, opts, widthFromLoader, qualityFromLoader);

  let url = chain.url();
  if (opts.crop) url = appendParam(url, "crop", opts.crop);
  return url;
}

type NextSanityImageProps = {
  readonly image: SanityImageData;
  readonly alt?: string;
  readonly transform?: TransformOptions;
} & Omit<ImageProps, "src" | "loader" | "alt">;

function NextSanityImageUnmemo({ image, alt = "", transform = {}, placeholder, ...props }: NextSanityImageProps) {
  const blurDataURL =
    typeof image.preview === "string" && image.preview.length > 0
      ? image.preview
      : undefined;
  const loader: ImageProps["loader"] = ({ width, quality }) => buildUrl(image, transform, width, quality);

  // Provide a stable base src; Next will call our loader for the final URL
  const baseSrc = buildUrl(image, transform);

  return (
    <Image
      alt={alt}
      loader={loader}
      src={baseSrc}
      placeholder={blurDataURL ? "blur" : placeholder}
      blurDataURL={blurDataURL}
      {...props}
    />
  );
}

function applyTransforms(
  chain: ReturnType<ReturnType<typeof imageUrlBuilder>["image"]>,
  opts: TransformOptions,
  widthFromLoader?: number,
  qualityFromLoader?: number
) {
  chain = applyBaseTransforms(chain, opts, widthFromLoader, qualityFromLoader);
  chain = applyEffectTransforms(chain, opts);
  return chain;
}

function applyBaseTransforms(
  chain: ReturnType<ReturnType<typeof imageUrlBuilder>["image"]>,
  opts: TransformOptions,
  widthFromLoader?: number,
  qualityFromLoader?: number
) {
  if (typeof widthFromLoader === "number") chain = chain.width(widthFromLoader);
  if (typeof opts.width === "number") chain = chain.width(opts.width);
  if (typeof opts.height === "number") chain = chain.height(opts.height);
  if (opts.fit) chain = chain.fit(opts.fit);
  if (opts.rect)
    chain = chain.rect(opts.rect.left, opts.rect.top, opts.rect.width, opts.rect.height);
  const quality = opts.quality ?? qualityFromLoader;
  if (typeof quality === "number") chain = chain.quality(quality);
  if (opts.autoFormat) chain = chain.auto("format");
  if (opts.format) chain = chain.format(opts.format);
  return chain;
}

function applyEffectTransforms(
  chain: ReturnType<ReturnType<typeof imageUrlBuilder>["image"]>,
  opts: TransformOptions
) {
  if (typeof opts.blur === "number") chain = chain.blur(opts.blur);
  if (typeof opts.saturation === "number") chain = chain.saturation(opts.saturation);
  if (typeof opts.sharpen === "number") chain = chain.sharpen(opts.sharpen);
  if (opts.sharpen === true) chain = chain.sharpen(1);
  if (typeof opts.dpr === "number") chain = chain.dpr(opts.dpr);
  if (opts.bg) chain = chain.bg(opts.bg);
  return chain;
}

function appendParam(url: string, key: string, value: string | number) {
  const hasQuery = url.includes("?");
  const sep = hasQuery ? "&" : "?";
  return `${url}${sep}${key}=${encodeURIComponent(String(value))}`;
}

export const NextSanityImage = memo(NextSanityImageUnmemo);
