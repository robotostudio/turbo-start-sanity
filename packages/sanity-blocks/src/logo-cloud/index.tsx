import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";

import { LogoLinkCell } from "../internal/logo-link-cell";

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
  return (
    <LogoLinkCell
      cellClassName="flex shrink-0 items-center justify-center"
      height={28}
      href={logo.href}
      image={logo.image}
      imageClassName="h-7 w-auto object-contain"
      openInNewTab={logo.openInNewTab}
      width={160}
    />
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
      <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:animate-none">
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
