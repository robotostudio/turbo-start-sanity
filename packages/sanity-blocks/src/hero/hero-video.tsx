"use client";

import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { type MuxVideoData, muxPlaybackId } from "../internal/mux";

/**
 * Loaded on demand: a static import would ship hls.js and mux-embed
 * (194 KB gzip, measured) to every route through the client-side page builder,
 * video or no video. Nothing renders before mount, so skipping SSR costs no
 * markup.
 */
const MuxVideo = dynamic(() => import("@mux/mux-video-react"), { ssr: false });

export interface HeroVideoVariant {
  mux?: MuxVideoData | null;
  poster?: SanityImageData | null;
}

export interface HeroVideoData {
  light?: HeroVideoVariant | null;
  dark?: HeroVideoVariant | null;
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
  const [mounted, setMounted] = useState(false);
  // The clip that decoded a frame, not a boolean: a theme toggle mounts a
  // fresh element, so readiness expires with the ID it was earned for.
  const [readyId, setReadyId] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const darkId = muxPlaybackId(video?.dark?.mux);
  const playbackId =
    resolvedTheme === "dark" && darkId
      ? darkId
      : muxPlaybackId(video?.light?.mux);

  if (!(mounted && playbackId) || prefersReducedMotion) {
    return null;
  }

  return (
    <MuxVideo
      aria-hidden
      autoPlay
      className={cn(
        "pointer-events-none size-full object-cover object-[50%_45%] transition-opacity duration-700 ease-out",
        readyId === playbackId ? "opacity-100" : "opacity-0",
        className
      )}
      // `pointer-events-none` is what keeps this decorative: without it a
      // right-click offers Chrome's "Show controls", which sticks per-site and
      // paints a transport bar over the hero. These two drop picture-in-picture
      // and casting from that menu.
      disablePictureInPicture
      disableRemotePlayback
      // The hero autoplays, so Mux Data would beacon and set a year-long
      // cookie on every visit, ahead of any consent gate. Drop this and set
      // `envKey` to opt back in.
      disableTracking
      key={playbackId}
      loop
      // A short loop replays from buffer, so ABR never steps up from whatever
      // the first segment picked. Capping the ladder high-first pins it to
      // 1080p immediately. Not higher: Mux ships H.264, and 2160p costs
      // several times the bytes for a background nobody is studying.
      maxResolution="1080p"
      muted
      onCanPlay={() => setReadyId(playbackId)}
      playbackId={playbackId}
      playsInline
      preload="auto"
      renditionOrder="desc"
      streamType="on-demand"
      tabIndex={-1}
    />
  );
}
