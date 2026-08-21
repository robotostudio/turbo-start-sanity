import { renderToStaticMarkup } from "react-dom/server";

import { VideoFeature } from "./index";

const READY = { playbackId: "abc123", policy: "public", status: "ready" };

const render = (props: Parameters<typeof VideoFeature>[0]) =>
  renderToStaticMarkup(<VideoFeature {...props} />);

// Nothing of the player reaches the server: it sits behind a dynamic import
// that only resolves in the browser, and only once a visitor asks for it.
test("VideoFeature renders the copy and a poster to press", () => {
  const html = render({
    caption: "Recorded live",
    eyebrow: "Watch",
    title: "The tour",
    video: { asset: READY },
  });

  expect(html).toMatch(/Watch/);
  expect(html).toMatch(/The tour/);
  expect(html).toMatch(/Recorded live/);
  expect(html).toMatch(/aria-label="Play video: The tour"/);
  expect(html).toMatch(
    /https:\/\/image\.mux\.com\/abc123\/thumbnail\.webp\?width=1200/
  );
});

// Returning null here would delete published copy from the page and leave the
// block unselectable in Presentation, while `.md` keeps printing the copy.
test.each([
  ["no upload yet", undefined],
  [
    "a failed encode",
    { playbackId: "abc123", policy: "public", status: "errored" },
  ],
  // Signed and DRM playback needs a JWT this starter never mints.
  [
    "a non-public playback policy",
    { playbackId: "abc123", policy: "signed", status: "ready" },
  ],
  // A weak reference to a deleted asset: GROQ still returns the object.
  [
    "a dangling reference",
    {
      playbackId: null,
      aspectRatio: null,
      status: null,
      thumbTime: null,
      title: null,
    },
  ],
])("VideoFeature keeps the copy but drops the video with %s", (_label, asset) => {
  const html = render({
    caption: "Recorded live",
    eyebrow: "Watch",
    title: "The tour",
    video: { asset },
  });

  expect(html).toMatch(/Watch/);
  expect(html).toMatch(/The tour/);
  expect(html).toMatch(/Recorded live/);
  expect(html).not.toMatch(/Play video/);
  expect(html).not.toMatch(/image\.mux\.com/);
});

test("VideoFeature posters from the editor's chosen frame", () => {
  const html = render({
    title: "The tour",
    video: { asset: { ...READY, thumbTime: 12.5 } },
  });

  expect(html).toContain(
    "https://image.mux.com/abc123/thumbnail.webp?time=12.5&amp;width=1200"
  );
});

// An autoplaying clip has nothing to press, so the facade steps aside and the
// player mounts straight away — client-side only, hence no markup here.
test("VideoFeature skips the facade when the editor asks for autoplay", () => {
  const html = render({
    title: "The tour",
    video: { asset: READY, autoPlay: true },
  });

  expect(html).not.toMatch(/Play video/);
  expect(html).toMatch(/The tour/);
});

test("VideoFeature reserves the box from Mux's aspect ratio", () => {
  const html = render({
    title: "The tour",
    video: { asset: { ...READY, aspectRatio: "21:9" } },
  });

  expect(html).toMatch(/aspect-ratio:21\/9/);
});

// Draft mode encodes the Studio edit URL into every string. It has no business
// reaching Mux Data or a screen reader, though the visible heading keeps it so
// the block stays click-to-edit.
test("VideoFeature strips stega from the title it passes on", () => {
  const zeroWidth = "\u200b\u200c\u200b\u200c";
  const html = render({
    title: `The tour${zeroWidth}`,
    video: { asset: READY },
  });
  const label = html.match(/aria-label="([^"]*)"/)?.[1] ?? "";

  expect(label).toBe("Play video: The tour");
  expect(html).toContain(zeroWidth);
});
