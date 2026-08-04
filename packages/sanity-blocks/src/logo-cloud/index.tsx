"use client";

import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";

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
}

function Logo({ logo }: Readonly<{ logo: LogoCloudLogo }>) {
  return (
    <LogoLinkCell
      cellClassName="flex shrink-0 items-center justify-center"
      height={80}
      href={logo.href}
      image={logo.image}
      imageClassName="w-auto object-contain"
      imageStyle={{
        height: normalizedLogoHeight(logo.image, {
          base: 28,
          min: 24,
          max: 32,
        }),
      }}
      openInNewTab={logo.openInNewTab}
      width={240}
    />
  );
}

const HOVER_PLAYBACK_RATE = 0.6;

const CYCLE_CLASS = "flex shrink-0 items-center gap-12 pr-12";

export function LogoCloud({ logos }: Readonly<LogoCloudProps>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  if (!(Array.isArray(logos) && logos.length > 0)) {
    return null;
  }

  const repeats = Math.max(1, Math.ceil(20 / logos.length));
  const loopLogos = Array.from({ length: repeats }, () => logos).flat();
  const fillerCycles = Math.max(0, repeats - 1);

  const setPlaybackRate = (rate: number) => {
    for (const animation of trackRef.current?.getAnimations() ?? []) {
      animation.playbackRate = rate;
    }
  };

  return (
    <section
      aria-label="Logo cloud"
      className="relative overflow-hidden bg-accent-green py-6"
      id="logo-cloud"
      onMouseEnter={() => setPlaybackRate(HOVER_PLAYBACK_RATE)}
      onMouseLeave={() => setPlaybackRate(1)}
    >
      <div
        className="flex w-max animate-marquee items-center focus-within:[animation-play-state:paused] motion-reduce:animate-none"
        ref={trackRef}
        style={{
          animationDuration: `${repeats * 35}s`,
          animationPlayState: isPaused ? "paused" : undefined,
        }}
      >
        <div className={CYCLE_CLASS}>
          {logos.map((logo) => (
            <Logo key={logo._key} logo={logo} />
          ))}
        </div>
        {Array.from({ length: fillerCycles }, (_, cycle) => (
          <div
            aria-hidden="true"
            className={CYCLE_CLASS}
            inert
            key={`fill-${cycle}`}
          >
            {logos.map((logo) => (
              <Logo key={`fill-${cycle}-${logo._key}`} logo={logo} />
            ))}
          </div>
        ))}
        <div aria-hidden="true" className={CYCLE_CLASS} inert>
          {loopLogos.map((logo, index) => (
            <Logo key={`dup-${logo._key}-${index}`} logo={logo} />
          ))}
        </div>
      </div>
      <button
        aria-label={isPaused ? "Play logo animation" : "Pause logo animation"}
        aria-pressed={isPaused}
        className="absolute top-2 right-2 z-10 grid size-8 place-items-center bg-background/80 text-foreground focus-ring-inset hover:bg-background motion-reduce:hidden"
        onClick={() => setIsPaused((paused) => !paused)}
        type="button"
      >
        {isPaused ? (
          <Play aria-hidden="true" className="size-4" />
        ) : (
          <Pause aria-hidden="true" className="size-4" />
        )}
      </button>
    </section>
  );
}
