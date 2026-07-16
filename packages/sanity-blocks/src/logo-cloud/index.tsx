"use client";

import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { useRef } from "react";

import { normalizedLogoHeight } from "../internal/logo-height";
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

// Logos are area-normalized (see normalizedLogoHeight) so a wide wordmark and a
// square mark carry equal visual weight within the 64px strip.
function Logo({ logo }: Readonly<{ logo: LogoCloudLogo }>) {
  return (
    <LogoLinkCell
      cellClassName="flex shrink-0 items-center justify-center"
      height={80}
      href={logo.href}
      image={logo.image}
      imageClassName="w-auto object-contain"
      imageStyle={{
        height: normalizedLogoHeight(logo.image, { base: 28, min: 22, max: 32 }),
      }}
      openInNewTab={logo.openInNewTab}
      width={240}
    />
  );
}

// Slow the marquee to a crawl on hover instead of hard-stopping it. Done via the
// Web Animations API playbackRate rather than a CSS animation-duration swap:
// changing duration re-interprets elapsed time against the new duration and makes
// the track jump, whereas playbackRate changes speed from the current position
// with no jump.
const HOVER_PLAYBACK_RATE = 0.6;

export function LogoCloud({ logos, title }: Readonly<LogoCloudProps>) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (!(Array.isArray(logos) && logos.length > 0)) {
    return null;
  }

  const setPlaybackRate = (rate: number) => {
    for (const animation of trackRef.current?.getAnimations() ?? []) {
      animation.playbackRate = rate;
    }
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hovering anywhere in the decorative marquee band slows it; the interactive elements are the logo links inside, and keyboard users get the focus-within pause.
    <section
      aria-label="Logo cloud"
      className="overflow-hidden bg-accent-green py-4"
      id="logo-cloud"
      onMouseEnter={() => setPlaybackRate(HOVER_PLAYBACK_RATE)}
      onMouseLeave={() => setPlaybackRate(1)}
    >
      {title ? (
        <p className="container mb-4 font-mono text-accent-green-foreground text-sm uppercase tracking-wide">
          {title}
        </p>
      ) : null}
      {/* Duplicate track so the -50% marquee translate loops seamlessly. */}
      <div
        className="flex w-max animate-marquee items-center focus-within:[animation-play-state:paused] motion-reduce:animate-none"
        ref={trackRef}
      >
        <div className="flex shrink-0 items-center gap-12 pr-12">
          {logos.map((logo) => (
            <Logo key={logo._key} logo={logo} />
          ))}
        </div>
        <div
          aria-hidden="true"
          className="flex shrink-0 items-center gap-12 pr-12"
          inert
        >
          {logos.map((logo) => (
            <Logo key={`dup-${logo._key}`} logo={logo} />
          ))}
        </div>
      </div>
    </section>
  );
}
