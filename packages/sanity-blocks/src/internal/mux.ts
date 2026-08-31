/**
 * The single place that knows Mux's URL shapes.
 *
 * Every value leaving here lands in a URL or a CSS declaration, so it is
 * stega-cleaned: Visual Editing hides characters inside strings that a browser
 * reads as part of the value.
 */

import { stegaClean } from "next-sanity";

/** What `muxVideoFields` projects — see `internal/groq-fragments`. */
export interface MuxVideoData {
  /** Mux's own aspect ratio for the source, in `16:9` form. */
  aspectRatio?: string | null;
  playbackId?: string | null;
  /** Mux's playback policy for that ID: `public`, `signed`, or `drm`. */
  policy?: string | null;
  /** `preparing`, `ready`, or `errored`. See `muxPlaybackId`. */
  status?: string | null;
  /** Seconds into the clip: the poster frame the editor scrubbed to. */
  thumbTime?: number | null;
  title?: string | null;
}

/**
 * The playback ID, withheld when the encode failed or the ID is not public.
 *
 * Deliberately not gated on `status === "ready"`: only a poll in the editor's
 * open browser tab advances that field, so a closed tab strands it at
 * `preparing` and would hide a playable video for good.
 *
 * The policy check is load-bearing. The plugin stores whichever ID Mux
 * returned first without checking its policy, and a signed or DRM ID needs a
 * JWT this starter never mints — it would 403 in the player and the thumbnail
 * while `status` still read `ready`.
 */
export function muxPlaybackId(video?: MuxVideoData | null): string | null {
  if (
    !video?.playbackId ||
    stegaClean(video.status) === "errored" ||
    stegaClean(video.policy) !== "public"
  ) {
    return null;
  }
  return stegaClean(video.playbackId);
}

/** Mux's `16:9` as the `16/9` CSS `aspect-ratio` accepts. Reserves the box. */
export function muxAspectRatio(video?: MuxVideoData | null): string {
  const ratio = stegaClean(video?.aspectRatio);
  return ratio ? ratio.replace(":", "/") : "16/9";
}

/**
 * The generated still, standing in for a poster Sanity never holds. Honours
 * `thumbTime`, without which a clip opening on a blank plate posters blank.
 */
export function muxThumbnailUrl(
  playbackId?: string | null,
  thumbTime?: number | null,
  width?: number
): string | undefined {
  if (!playbackId) {
    return undefined;
  }
  const params = new URLSearchParams();
  // `time=0` is a real frame choice, hence the type check.
  if (typeof thumbTime === "number") {
    params.set("time", String(thumbTime));
  }
  // Unasked, Mux serves the still at the source resolution — 4K for a poster.
  if (width) {
    params.set("width", String(width));
  }
  const query = params.size ? `?${params}` : "";
  return `https://image.mux.com/${playbackId}/thumbnail.webp${query}`;
}

/** The static-rendition resolutions this starter asks Mux to keep on hand. */
export type MuxMp4Resolution = "1080p" | "720p" | "480p" | "270p";

/**
 * A progressive MP4 straight off Mux's origin, no manifest and no player.
 *
 * These exist only for assets that had static renditions enabled — either at
 * upload, or afterwards via `POST /video/v1/assets/{id}/static-renditions`.
 * Mux 404s the URL otherwise, which is why `muxMp4Url` is a URL builder and
 * not a promise that the file is there: the caller has to be willing to fall
 * back. Enabling them costs Mux storage per rendition.
 */
export function muxMp4Url(
  playbackId?: string | null,
  resolution: MuxMp4Resolution = "1080p"
): string | undefined {
  if (!playbackId) {
    return undefined;
  }
  return `https://stream.mux.com/${playbackId}/${resolution}.mp4`;
}
