import { rungFor } from "@workspace/sanity-blocks/hero/hero-video";
import {
  isMuxPath,
  mediaTypeOf,
} from "@workspace/sanity-blocks/hero/media-type";

const READY_MUX = {
  playbackId: "abc123",
  status: "ready",
  policy: "public",
  aspectRatio: "16:9",
};

test("an explicit mediaType wins over what the variant carries", () => {
  expect(mediaTypeOf({ mediaType: "sanity", mux: READY_MUX })).toBe("sanity");
  expect(mediaTypeOf({ mediaType: "mux", mux: null })).toBe("mux");
});

// The field arrived after the documents did, so an absent value is the common
// case. Inferring is what keeps every hero authored before the toggle alive.
test("an absent mediaType is inferred from what is actually there", () => {
  expect(mediaTypeOf({ mux: READY_MUX })).toBe("mux");
  expect(mediaTypeOf({})).toBe("sanity");
  expect(mediaTypeOf(null)).toBe("sanity");
  expect(mediaTypeOf(undefined)).toBe("sanity");
});

// A signed or errored asset yields no playback id, so there is nothing for the
// Mux path to render — inferring "mux" there would blank the hero.
test("an unplayable Mux asset infers the file path, not Mux", () => {
  expect(mediaTypeOf({ mux: { ...READY_MUX, policy: "signed" } })).toBe(
    "sanity"
  );
  expect(mediaTypeOf({ mux: { ...READY_MUX, status: "errored" } })).toBe(
    "sanity"
  );
});

test("an unrecognised mediaType falls back to inference", () => {
  expect(mediaTypeOf({ mediaType: "cloudflare", mux: READY_MUX })).toBe("mux");
  expect(mediaTypeOf({ mediaType: "", mux: null })).toBe("sanity");
});

test("the progressive-MP4 path is recognised and counts as Mux", () => {
  expect(mediaTypeOf({ mediaType: "mux-mp4", mux: READY_MUX })).toBe("mux-mp4");
  expect(isMuxPath(mediaTypeOf({ mediaType: "mux-mp4", mux: READY_MUX }))).toBe(
    true
  );
  expect(isMuxPath("mux")).toBe(true);
  expect(isMuxPath("sanity")).toBe(false);
});

// Nothing infers to mux-mp4: static renditions may not exist for an asset, so
// it is only ever reached by an explicit choice.
test("mux-mp4 is never inferred, only chosen", () => {
  expect(mediaTypeOf({ mux: READY_MUX })).toBe("mux");
  expect(mediaTypeOf({})).toBe("sanity");
});

test("the rung follows the width, and a thin link overrides it", () => {
  expect(rungFor(1440)).toBe("1080p");
  expect(rungFor(1280)).toBe("1080p");
  expect(rungFor(390)).toBe("720p");
  // Save-Data and 2g both mean "not the big one", whatever the screen says.
  expect(rungFor(1440, { saveData: true })).toBe("480p");
  expect(rungFor(1440, { effectiveType: "slow-2g" })).toBe("480p");
  expect(rungFor(1440, { effectiveType: "2g" })).toBe("480p");
  // 3g and 4g are not thin enough to give up resolution for.
  expect(rungFor(1440, { effectiveType: "4g" })).toBe("1080p");
  expect(rungFor(390, { effectiveType: "3g" })).toBe("720p");
});
