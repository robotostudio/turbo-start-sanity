import { stegaClean } from "next-sanity";

import { type MuxVideoData, muxPlaybackId } from "../internal/mux";

/** The two delivery paths a hero background can take. */
export type HeroMediaType = "mux" | "sanity";

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
export function mediaTypeOf(
  variant?: HeroMediaSelection | null
): HeroMediaType {
  const explicit = stegaClean(variant?.mediaType);
  if (explicit === "mux" || explicit === "sanity") {
    return explicit;
  }
  return muxPlaybackId(variant?.mux) ? "mux" : "sanity";
}
