"use client";

import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export interface HeroVideoVariant {
  /** Full-resolution HEVC for Safari, which decodes AV1 only on recent chips. */
  hevc?: string | null;
  /** Phone-sized clips. Optional — the desktop set is used when absent. */
  mobileWebm?: string | null;
  poster?: SanityImageData | null;
  webm?: string | null;
}

export interface HeroVideoData {
  light?: HeroVideoVariant | null;
  dark?: HeroVideoVariant | null;
}

function hasSource(variant?: HeroVideoVariant | null): boolean {
  return Boolean(variant?.webm || variant?.hevc || variant?.mobileWebm);
}

/**
 * Tracks whether this is a phone-sized viewport. The `media` attribute on
 * `<source>` was dropped from the spec and Chrome ignores it, so picking in JS
 * is the only portable option.
 */
function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    setIsPhone(query.matches);
    const onChange = (event: MediaQueryListEvent) => setIsPhone(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return isPhone;
}

/**
 * The clips for this viewport. Only the WebM has a phone-sized version;
 * anything that cannot decode it drops to the desktop HEVC, still the
 * smallest file in the set.
 */
function pickSources(variant: HeroVideoVariant | null, isPhone: boolean) {
  if (isPhone) {
    return {
      hevc: variant?.hevc,
      webm: variant?.mobileWebm ?? variant?.webm,
    };
  }
  return { hevc: variant?.hevc, webm: variant?.webm };
}

/** Tracks the reduced-motion preference, including changes made after load. */
function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) =>
      setPrefersReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return prefersReduced;
}

/**
 * Background video for the hero, layered over the poster.
 *
 * Renders nothing until the clip can play, then fades in, so the poster covers
 * the load. Mounting client-side is deliberate: the theme comes from
 * `next-themes` and this site has a manual toggle, so a CSS
 * `prefers-color-scheme` source would pick the wrong variant.
 */
export function HeroVideo({
  className,
  video,
}: Readonly<{ className?: string; video?: HeroVideoData | null }>) {
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isPhone = useIsPhone();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => setMounted(true), []);

  // Dark falls back to the light clip so a single upload still works.
  const variant =
    resolvedTheme === "dark" && hasSource(video?.dark)
      ? video?.dark
      : video?.light;
  const sources = pickSources(variant ?? null, isPhone);

  if (!(mounted && hasSource(variant)) || prefersReducedMotion) {
    return null;
  }

  return (
    <video
      aria-hidden="true"
      autoPlay
      className={cn(
        "pointer-events-none size-full object-cover object-[50%_45%] transition-opacity duration-700 ease-out",
        ready ? "opacity-100" : "opacity-0",
        className
      )}
      // Decorative background. `pointer-events-none` is what actually keeps it
      // inert: without it a right-click offers Chrome's "Show controls", which
      // sticks per-site and paints a full transport bar over the hero. The two
      // attributes below drop picture-in-picture and casting from that menu.
      disablePictureInPicture
      disableRemotePlayback
      key={sources.webm ?? sources.hevc}
      loop
      muted
      onCanPlay={() => setReady(true)}
      playsInline
      preload="auto"
      tabIndex={-1}
    >
      {sources.webm && <source src={sources.webm} type="video/webm" />}
      {/*
        The codec string is required, not decoration: as plain `video/mp4`
        every browser would accept this and then fail to decode it, since
        <source> selection is by type alone.
      */}
      {sources.hevc && (
        <source src={sources.hevc} type='video/mp4; codecs="hvc1"' />
      )}
    </video>
  );
}
