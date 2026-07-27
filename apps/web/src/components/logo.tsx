import {
  SanityImage,
  type SanityImageData,
} from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";

type LogoProps = {
  image?: SanityImageData | null;
  imageDark?: SanityImageData | null;
  alt?: string | null;
  className?: string;
  linkClassName?: string;
  priority?: boolean;
};

export function Logo({
  image,
  imageDark,
  alt = "logo",
  className,
  linkClassName,
  priority = true,
}: LogoProps) {
  if (!image?.id) {
    return (
      <Link
        className={cn(
          "inline-block rounded-md font-semibold text-lg focus-ring",
          linkClassName
        )}
        href="/"
      >
        {alt ?? "Home"}
      </Link>
    );
  }

  const loading = priority ? "eager" : "lazy";

  return (
    <Link
      className={cn("inline-block rounded-md focus-ring", linkClassName)}
      href="/"
    >
      {imageDark?.id ? (
        <>
          <SanityImage
            className={cn("h-auto w-44 dark:hidden", className)}
            height={32}
            image={{ ...image, alt: alt ?? image.alt }}
            loading={loading}
            width={210}
          />
          <SanityImage
            className={cn("hidden h-auto w-44 dark:block", className)}
            height={32}
            image={{ ...imageDark, alt: alt ?? imageDark.alt }}
            loading={loading}
            width={210}
          />
        </>
      ) : (
        <SanityImage
          className={cn("h-auto w-44", className)}
          height={32}
          image={{ ...image, alt: alt ?? image.alt }}
          loading={loading}
          width={210}
        />
      )}
    </Link>
  );
}
