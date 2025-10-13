import Image from "next/image";
import Link from "next/link";

import type { Maybe, SanityImageProps } from "@/types";

import { SanityImage } from "./elements/sanity-image";

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
    <Link className="" href="/">
      {image ? (
        <SanityImage
          alt={alt ?? "logo"}
          className="w-[170px] dark:invert"
          // width={width}
          // height={height}
          decoding="sync"
          image={image}
          loading="eager"
        />
      ) : (
        <Image
          alt={alt ?? "logo"}
          className="h-[40px] w-[170px] dark:invert"
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
