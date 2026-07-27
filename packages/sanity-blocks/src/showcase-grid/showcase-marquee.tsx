"use client";

import {
  SanityImage,
  type SanityImageData,
} from "@workspace/sanity-blocks/internal/sanity-image";
import { useRef } from "react";

const HOVER_PLAYBACK_RATE = 0.85;

type MarqueeShot = { id: string; name: string; image: SanityImageData };

export function ShowcaseMarquee({ shots }: Readonly<{ shots: MarqueeShot[] }>) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (shots.length === 0) {
    return null;
  }

  const loop = [...shots, ...shots];
  const duration = Math.max(28, shots.length * 8);

  const setPlaybackRate = (rate: number) => {
    for (const animation of trackRef.current?.getAnimations() ?? []) {
      animation.playbackRate = rate;
    }
  };

  return (
    <div
      aria-hidden="true"
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setPlaybackRate(HOVER_PLAYBACK_RATE)}
      onMouseLeave={() => setPlaybackRate(1)}
    >
      <div
        className="flex w-max animate-marquee motion-reduce:animate-none"
        ref={trackRef}
        style={{ animationDuration: `${duration}s` }}
      >
        {loop.map((shot, index) => (
          <div
            className="relative mr-2 aspect-video h-56 shrink-0 overflow-hidden bg-muted sm:h-80 lg:h-[28.5rem]"
            key={`${shot.id}-${index}`}
          >
            <SanityImage
              alt={`${shot.name} website screenshot`}
              className="absolute inset-0 size-full object-cover"
              height={810}
              image={shot.image}
              sizes="(min-width: 1024px) 810px, (min-width: 640px) 570px, 400px"
              width={1440}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
