import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import Image from "next/image";
import Link from "next/link";

import type { Maybe, SanityImageProps } from "@/types";

const LOGO_URL =
  "https://cdn.sanity.io/images/s6kuy1ts/production/68c438f68264717e93c7ba1e85f1d0c4b58b33c2-1200x621.svg";

type LogoProps = {
  src?: Maybe<string>;
  image?: Maybe<SanityImageProps>;
  alt?: Maybe<string>;
  width?: number;
  height?: number;
  priority?: boolean;
};

export function Logo({
  src,
  alt = "logo",
  image,
  width = 170,
  height = 40,
  priority = true,
}: LogoProps) {
  return (
    <Link
      className="inline-block rounded-md outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      href="/"
    >
      {image ? (
        <SanityImage
          alt={alt ?? "logo"}
          className="w-40 dark:filter-[invert(1)_saturate(0)_brightness(1.15)]"
          decoding="sync"
          image={image}
          loading="eager"
        />
      ) : (
        <Image
          alt={alt ?? "logo"}
          className="h-10 w-40 dark:filter-[invert(1)_saturate(0)_brightness(1.15)]"
          decoding="sync"
          height={height}
          loading="eager"
          priority={priority}
          src={src ?? LOGO_URL}
          width={width}
        />
      )}
    </Link>
  );
}
