/**
 * These helpers decide whether a video renders at all, and every value they
 * return lands in a URL or a CSS declaration, so the edge cases matter more
 * than the happy path.
 */

import { muxVideoToMarkdown } from "./markdown";
import { muxAspectRatio, muxPlaybackId, muxThumbnailUrl } from "./mux";

const ready = {
  playbackId: "abc123",
  policy: "public",
  status: "ready",
  aspectRatio: "16:9",
};

test("muxPlaybackId returns the id for a ready public asset", () => {
  expect(muxPlaybackId(ready)).toBe("abc123");
});

test("muxPlaybackId withholds the id when the encode errored", () => {
  expect(muxPlaybackId({ ...ready, status: "errored" })).toBeNull();
});

test("muxPlaybackId returns the id while the asset is still preparing", () => {
  expect(muxPlaybackId({ ...ready, status: "preparing" })).toBe("abc123");
});

test("muxPlaybackId withholds a signed id", () => {
  expect(muxPlaybackId({ ...ready, policy: "signed" })).toBeNull();
});

test("muxPlaybackId withholds a drm id", () => {
  expect(muxPlaybackId({ ...ready, policy: "drm" })).toBeNull();
});

test("muxPlaybackId withholds an id with no policy", () => {
  expect(muxPlaybackId({ playbackId: "abc123", status: "ready" })).toBeNull();
});

test("muxPlaybackId handles a dangling asset reference", () => {
  expect(
    muxPlaybackId({
      playbackId: null,
      policy: null,
      status: null,
      aspectRatio: null,
      thumbTime: null,
      title: null,
    })
  ).toBeNull();
});

test("muxPlaybackId handles a missing video", () => {
  expect(muxPlaybackId(null)).toBeNull();
  expect(muxPlaybackId()).toBeNull();
});

test("muxAspectRatio converts Mux's colon form to CSS", () => {
  expect(muxAspectRatio({ aspectRatio: "16:9" })).toBe("16/9");
  expect(muxAspectRatio({ aspectRatio: "9:16" })).toBe("9/16");
});

test("muxAspectRatio falls back to 16/9 on an empty string", () => {
  expect(muxAspectRatio({ aspectRatio: "" })).toBe("16/9");
});

test("muxAspectRatio falls back to 16/9 when the ratio is missing", () => {
  expect(muxAspectRatio({})).toBe("16/9");
  expect(muxAspectRatio({ aspectRatio: null })).toBe("16/9");
  expect(muxAspectRatio(null)).toBe("16/9");
});

test("muxThumbnailUrl pins the frame when thumbTime is zero", () => {
  expect(muxThumbnailUrl("abc123", 0)).toBe(
    "https://image.mux.com/abc123/thumbnail.webp?time=0"
  );
});

test("muxThumbnailUrl omits the time when no frame was picked", () => {
  expect(muxThumbnailUrl("abc123")).toBe(
    "https://image.mux.com/abc123/thumbnail.webp"
  );
  expect(muxThumbnailUrl("abc123", null)).toBe(
    "https://image.mux.com/abc123/thumbnail.webp"
  );
});

test("muxThumbnailUrl returns undefined without a playback id", () => {
  expect(muxThumbnailUrl(null)).toBeUndefined();
  expect(muxThumbnailUrl("")).toBeUndefined();
});

test("muxVideoToMarkdown renders the generated still", () => {
  expect(muxVideoToMarkdown({ ...ready, thumbTime: 12 }, "A demo")).toBe(
    "![A demo](https://image.mux.com/abc123/thumbnail.webp?time=12&width=1200)"
  );
});

test("muxVideoToMarkdown returns empty string without a usable id", () => {
  expect(muxVideoToMarkdown({ ...ready, policy: "signed" }, "A demo")).toBe("");
  expect(muxVideoToMarkdown({ ...ready, status: "errored" }, "A demo")).toBe(
    ""
  );
  expect(muxVideoToMarkdown(null)).toBe("");
});
