import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import Link from "next/link";

export interface LogoCloudLogo {
  _key: string;
  href?: string | null;
  image?: SanityImageData | null;
  openInNewTab?: boolean | null;
}

export interface LogoCloudProps {
  logos?: LogoCloudLogo[] | null;
  title?: string | null;
}

function Logo({ logo }: Readonly<{ logo: LogoCloudLogo }>) {
  const { image, href, openInNewTab } = logo;

  if (!image?.id) {
    return null;
  }

  const media = (
    <SanityImage
      className="h-7 w-auto object-contain"
      height={28}
      image={image}
      loading="lazy"
      width={160}
    />
  );

  if (href) {
    return (
      <Link
        className="flex shrink-0 items-center justify-center"
        href={href}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        target={openInNewTab ? "_blank" : undefined}
      >
        {media}
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 items-center justify-center">{media}</div>
  );
}

export function LogoCloud({ logos }: Readonly<LogoCloudProps>) {
  if (!(Array.isArray(logos) && logos.length > 0)) {
    return null;
  }

  return (
    <section
      aria-label="Logo cloud"
      className="overflow-hidden bg-accent-green py-4"
      id="logo-cloud"
    >
      {/* Duplicate track so the -50% marquee translate loops seamlessly. */}
      <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused] motion-reduce:animate-none">
        <div className="flex shrink-0 items-center gap-12 pr-12">
          {logos.map((logo) => (
            <Logo key={logo._key} logo={logo} />
          ))}
        </div>
        <div
          aria-hidden="true"
          className="flex shrink-0 items-center gap-12 pr-12"
        >
          {logos.map((logo) => (
            <Logo key={`dup-${logo._key}`} logo={logo} />
          ))}
        </div>
      </div>
    </section>
  );
}
