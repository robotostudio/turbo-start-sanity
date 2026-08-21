import { stegaClean } from "next-sanity";

import { type MuxVideoData, muxPlaybackId } from "../internal/mux";

/**
 * The three delivery paths a hero background can take.
 *
 * `mux` is the adaptive HLS ladder, which needs hls.js to drive it. `mux-mp4`
 * is the same asset served as one progressive file, which needs no player at
 * all but only exists where static renditions were enabled. `sanity` is the
 * hand-encoded set on the asset CDN.
 */
export type HeroMediaType = "mux" | "mux-mp4" | "sanity";

/**
 * The shape `mediaTypeOf` reads. Structural on purpose: the rendered hero's
 * variant and the Markdown serializer's both satisfy it without either
 * importing the other.
 */
export interface HeroMediaSelection {
  mediaType?: string | null;
  mux?: MuxVideoData | null;
}

/**
 * The selected path, inferred when unset.
 *
 * `mediaType` arrived after the documents did, so a missing value is the
 * common case rather than the broken one: read what the variant actually
 * carries instead of defaulting, or every hero authored before the toggle
 * would go blank.
 *
 * Deliberately kept out of `hero-video`, which is a client module that pulls
 * in the Mux player graph — the Markdown route needs this answer too, and must
 * not pay for hls.js to get it.
 */
const PATHS: readonly HeroMediaType[] = ["mux", "mux-mp4", "sanity"];

export function mediaTypeOf(
  variant?: HeroMediaSelection | null
): HeroMediaType {
  const explicit = stegaClean(variant?.mediaType) as HeroMediaType;
  if (PATHS.includes(explicit)) {
    return explicit;
  }
  return muxPlaybackId(variant?.mux) ? "mux" : "sanity";
}

/** Whether this path plays a Mux asset, however it is delivered. */
export function isMuxPath(type: HeroMediaType): boolean {
  return type === "mux" || type === "mux-mp4";
}
