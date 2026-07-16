import Link from "next/link";

import type { SanityImageData } from "./sanity-image";
import { resolveAssetId, SanityImage } from "./sanity-image";

export interface LogoLinkCellProps {
  image?: SanityImageData | null;
  href?: string | null;
  openInNewTab?: boolean | null;
  imageClassName: string;
  cellClassName: string;
  height: number;
  width: number;
}

/**
 * A single brand-logo cell shared by the Logo Cloud and the CTA "used by teams"
 * strip: renders the image, optionally wrapped in a link. Returns null when the
 * image has no usable asset id. Sizing and cell styling are passed in so each
 * caller keeps its own layout.
 */
export function LogoLinkCell({
  image,
  href,
  openInNewTab,
  imageClassName,
  cellClassName,
  height,
  width,
}: Readonly<LogoLinkCellProps>) {
  // Gate on the same validity SanityImage uses, so a malformed id renders
  // nothing rather than an empty (unnamed) link wrapping a null image.
  if (!(resolveAssetId(image) && image)) {
    return null;
  }

  const media = (
    <SanityImage
      className={imageClassName}
      height={height}
      image={image}
      loading="lazy"
      width={width}
    />
  );

  // Only wrap in a link when the logo has alt text — the SanityImage's alt is
  // the anchor's accessible name, so linking an alt-less image yields an unnamed
  // link. Alt-less logos still render, just unlinked.
  if (href && image.alt?.trim()) {
    return (
      <Link
        className={cellClassName}
        href={href}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        target={openInNewTab ? "_blank" : undefined}
      >
        {media}
      </Link>
    );
  }

  return <div className={cellClassName}>{media}</div>;
}
