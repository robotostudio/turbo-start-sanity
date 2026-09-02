"use client";

import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import dynamic from "next/dynamic";
import { stegaClean } from "next-sanity";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { type MuxVideoData, muxMp4Url, muxPlaybackId } from "../internal/mux";
import { isMuxPath, mediaTypeOf } from "./media-type";

export type { HeroMediaType } from "./media-type";
export { isMuxPath, mediaTypeOf } from "./media-type";

/**
 * Loaded on demand: a static import would ship hls.js and mux-embed
 * (194 KB gzip, measured) to every route through the client-side page builder,
 * video or no video. Nothing renders before mount, so skipping SSR costs no
 * markup. It also means a hero set to `sanity` never pays for the player —
 * which is what makes the two delivery paths comparable on the same site.
 */
const MuxVideo = dynamic(() => import("@mux/mux-video-react"), { ssr: false });

export interface HeroVideoVariant {
  /** Which path renders. Absent on anything authored before the toggle. */
  mediaType?: string | null;
  mux?: MuxVideoData | null;
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

/** Shared by both elements, so the two paths differ only in how bytes arrive. */
const BACKGROUND_CLASS =
  "pointer-events-none size-full object-cover object-[50%_45%] transition-opacity duration-700 ease-out";

function hasFiles(variant?: HeroVideoVariant | null): boolean {
  return Boolean(variant?.webm || variant?.hevc || variant?.mobileWebm);
}

/** Whether the path this variant selected has something to play. */
function hasSource(variant?: HeroVideoVariant | null): boolean {
  return isMuxPath(mediaTypeOf(variant))
    ? Boolean(muxPlaybackId(variant?.mux))
    : hasFiles(variant);
}

/**
 * Identifies the clip on screen. A theme toggle mounts a fresh element, so
 * readiness has to expire with the source it was earned for.
 */
function sourceKeyOf(variant?: HeroVideoVariant | null): string | null {
  if (isMuxPath(mediaTypeOf(variant))) {
    return muxPlaybackId(variant?.mux);
  }
  return (
    stegaClean(variant?.webm ?? variant?.hevc ?? variant?.mobileWebm) ?? null
  );
}

/** The resolutions every path picks between. */
export type DeliveryRung = "1080p" | "720p" | "480p";

type Connection = { effectiveType?: string; saveData?: boolean };

/**
 * The rendition for this screen and connection.
 *
 * Split from the globals so it is testable: `deliveryRung` reads them, this
 * decides. `saveData` and `effectiveType` are Chromium-only, so Safari and
 * Firefox fall through to the width, which is the answer they had before.
 */
export function rungFor(width: number, connection?: Connection): DeliveryRung {
  if (
    connection?.saveData ||
    /(^|-)2g$/.test(connection?.effectiveType ?? "")
  ) {
    return "480p";
  }
  return width >= 1280 ? "1080p" : "720p";
}

/**
 * Read once, at mount. Deliberately not reactive: `key` is the source URL, so
 * re-picking on a resize would remount the element and re-download the clip —
 * worse than leaving an already-buffered loop alone. Safe to call during render
 * because `HeroVideo` renders nothing until it has mounted.
 */
function deliveryRung(): DeliveryRung {
  const { connection } = navigator as Navigator & { connection?: Connection };
  return rungFor(window.innerWidth, connection);
}

/**
 * The clips for this viewport. Only the WebM has a smaller version; anything
 * that cannot decode it drops to the desktop HEVC, still the smallest file in
 * the set.
 */
function pickSources(variant: HeroVideoVariant | null, rung: DeliveryRung) {
  // Only two encodes exist, so anything below the desktop rung takes the
  // smaller one — including a wide screen on a metered connection.
  const webm =
    rung === "1080p" ? variant?.webm : (variant?.mobileWebm ?? variant?.webm);
  return {
    hevc: stegaClean(variant?.hevc) ?? undefined,
    webm: stegaClean(webm) ?? undefined,
  };
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

type BackgroundProps = Readonly<{
  className?: string;
  onReady: () => void;
  variant: HeroVideoVariant;
}>;

/** Mux: one upload, an adaptive ladder, and hls.js to drive it. */
function MuxBackground({ className, onReady, variant }: BackgroundProps) {
  const rung = deliveryRung();
  const playbackId = muxPlaybackId(variant.mux);
  if (!playbackId) {
    return null;
  }

  // `maxResolution` bottoms out at 720p, so a thin link gets the ladder
  // instead: releasing `desc` lets ABR settle on 480p or 270p itself. Pinning
  // the top rung is right everywhere else, since a short loop replays from
  // buffer and so never steps up on its own.
  const thin = rung === "480p";

  return (
    <MuxVideo
      aria-hidden
      autoPlay
      className={className}
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
      maxResolution={thin ? "720p" : rung}
      muted
      onCanPlay={onReady}
      playbackId={playbackId}
      playsInline
      preload="auto"
      renditionOrder={thin ? undefined : "desc"}
      streamType="on-demand"
      tabIndex={-1}
    />
  );
}

/**
 * Mux, delivered as one progressive MP4 instead of an adaptive ladder.
 *
 * The point of this path is what it does *not* load: no hls.js, no mux-embed,
 * no master and rendition manifests. It is a bare `<video>` pointed at Mux's
 * origin, so the browser starts fetching the moment the element mounts, the
 * same way the Sanity path does.
 *
 * The trade is that the rendition is chosen here rather than by ABR, so a slow
 * link gets no step-down — it just buffers. Resolution follows the viewport,
 * matching what the hand-encoded set does across the same breakpoint.
 */
function MuxMp4Background({ className, onReady, variant }: BackgroundProps) {
  const rung = deliveryRung();
  const playbackId = muxPlaybackId(variant.mux);
  const src = muxMp4Url(playbackId, rung);
  if (!src) {
    return null;
  }

  return (
    <video
      aria-hidden="true"
      autoPlay
      className={className}
      disablePictureInPicture
      disableRemotePlayback
      key={src}
      loop
      muted
      onCanPlay={onReady}
      playsInline
      preload="auto"
      src={src}
      tabIndex={-1}
    />
  );
}

/** Sanity: the hand-encoded set, served straight off the asset CDN. */
function FileBackground({ className, onReady, variant }: BackgroundProps) {
  const rung = deliveryRung();
  const sources = pickSources(variant, rung);
  if (!(sources.webm || sources.hevc)) {
    return null;
  }

  return (
    <video
      aria-hidden="true"
      autoPlay
      className={className}
      disablePictureInPicture
      disableRemotePlayback
      key={sources.webm ?? sources.hevc}
      loop
      muted
      onCanPlay={onReady}
      playsInline
      preload="auto"
      tabIndex={-1}
    >
      {sources.webm && (
        <source src={sources.webm} type='video/webm; codecs="av01.0.05M.08"' />
      )}
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

/**
 * Background video for the hero, layered over the poster.
 *
 * Renders nothing until the clip can play, then fades in, so the poster covers
 * the load. Mounting client-side is deliberate: the theme comes from
 * `next-themes` and this site has a manual toggle, so a CSS
 * `prefers-color-scheme` source would pick the wrong variant.
 *
 * Which element renders is the variant's own `mediaType`, so one page can be
 * served by Mux and another by the Sanity CDN with nothing else differing.
 */
export function HeroVideo({
  className,
  video,
}: Readonly<{ className?: string; video?: HeroVideoData | null }>) {
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);
  // The clip that decoded a frame, not a boolean: a theme toggle mounts a
  // fresh element, so readiness expires with the source it was earned for.
  const [readyKey, setReadyKey] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  // Dark falls back to the light variant so a single upload still works.
  const variant =
    resolvedTheme === "dark" && hasSource(video?.dark)
      ? video?.dark
      : video?.light;
  const sourceKey = sourceKeyOf(variant);

  if (!(mounted && variant && hasSource(variant)) || prefersReducedMotion) {
    return null;
  }

  const shared = cn(
    BACKGROUND_CLASS,
    readyKey === sourceKey ? "opacity-100" : "opacity-0",
    className
  );
  const onReady = () => setReadyKey(sourceKey);
  const props = { className: shared, onReady, variant };

  switch (mediaTypeOf(variant)) {
    case "mux":
      return <MuxBackground {...props} />;
    case "mux-mp4":
      return <MuxMp4Background {...props} />;
    default:
      return <FileBackground {...props} />;
  }
}
