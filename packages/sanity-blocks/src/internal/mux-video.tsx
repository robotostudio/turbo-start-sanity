"use client";

import { cn } from "@workspace/tailwind-config/utils";
import { Play } from "lucide-react";
import { stegaClean } from "next-sanity";
import dynamic from "next/dynamic";
import { useState } from "react";

import {
  type MuxVideoData,
  muxAspectRatio,
  muxPlaybackId,
  muxThumbnailUrl,
} from "./mux";

/** ~100 kB of chrome over hls.js: it arrives only when someone asks to watch. */
const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
});

/** Wide enough for a full-bleed block, small enough not to ship a 4K still. */
const POSTER_WIDTH = 1200;

/**
 * Two choices, deliberately: "hide controls" would ship a clip nobody can
 * pause, and muting follows from `autoPlay` because browsers refuse autoplay
 * with sound.
 */
export interface MuxVideoOptions {
  autoPlay?: boolean | null;
  loop?: boolean | null;
}

export interface MuxVideoProps {
  className?: string;
  options?: MuxVideoOptions | null;
  title?: string | null;
  video?: MuxVideoData | null;
}

/**
 * A Mux clip for content, which waits to be asked for: until then it is a
 * poster and a play button, so neither the player nor the video bytes Mux
 * bills are spent on someone who never watches.
 *
 * Background video goes through `hero-video` instead — no chrome, theme-aware.
 */
export function MuxVideo({
  className,
  options,
  title,
  video,
}: Readonly<MuxVideoProps>) {
  const autoPlay = Boolean(options?.autoPlay);
  const [playing, setPlaying] = useState(autoPlay);

  const playbackId = muxPlaybackId(video);
  if (!playbackId) {
    return null;
  }

  const poster = muxThumbnailUrl(playbackId, video?.thumbTime, POSTER_WIDTH);
  const videoTitle = stegaClean(title) ?? undefined;

  return (
    // The box outlives both states: `dynamic` renders nothing while the player
    // downloads, and without it the block would collapse to zero height and
    // shove the page around. The poster covers that wait.
    <div
      className={cn("relative w-full overflow-hidden bg-muted", className)}
      style={{ aspectRatio: muxAspectRatio(video) }}
    >
      {poster && (
        // biome-ignore lint/performance/noImgElement: Mux serves this already sized and encoded from its own CDN; next/image would add a proxy hop for nothing.
        <img
          alt=""
          className="absolute inset-0 size-full object-cover"
          src={poster}
        />
      )}
      {playing ? (
        <MuxPlayer
          autoPlay={autoPlay ? "muted" : true}
          className="absolute inset-0 size-full"
          // Mux Data would beacon and set a year-long cookie ahead of any
          // consent gate. Drop this and set `envKey` to opt back in.
          disableTracking
          loop={Boolean(options?.loop)}
          // Stega-encoded strings carry the Studio edit URL — project id,
          // dataset, document id — off to Mux on every draft-mode view.
          metadata={videoTitle ? { video_title: videoTitle } : undefined}
          muted={autoPlay}
          placeholder={poster}
          playbackId={playbackId}
          streamType="on-demand"
          thumbnailTime={video?.thumbTime ?? undefined}
        />
      ) : (
        <button
          aria-label={videoTitle ? `Play video: ${videoTitle}` : "Play video"}
          className="group absolute inset-0 grid place-items-center"
          onClick={() => setPlaying(true)}
          type="button"
        >
          <span className="grid size-14 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition group-hover:scale-105 group-hover:bg-background">
            <Play className="size-6 translate-x-px fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
