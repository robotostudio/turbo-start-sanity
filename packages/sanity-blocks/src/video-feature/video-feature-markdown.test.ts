import { heroToMarkdown } from "../hero/markdown";
import { videoFeatureToMarkdown } from "./markdown";

const para = (text: string) => [
  {
    _type: "block",
    style: "normal",
    children: [{ _type: "span", text }],
  },
];

const READY = { playbackId: "abc123", policy: "public", status: "ready" };

test("videoFeatureToMarkdown returns empty string for a fully empty block", () => {
  expect(videoFeatureToMarkdown({}, {})).toBe("");
});

test("videoFeatureToMarkdown renders eyebrow, title, richText, and the still", () => {
  const result = videoFeatureToMarkdown(
    {
      eyebrow: "Watch",
      title: "The tour",
      richText: para("Two minutes."),
      video: { asset: READY },
    },
    {}
  );
  expect(result).toBe(
    "**Watch**\n\n## The tour\n\nTwo minutes.\n\n![The tour](https://image.mux.com/abc123/thumbnail.webp?width=1200)"
  );
});

test("videoFeatureToMarkdown prefers the caption as the still's alt text", () => {
  const result = videoFeatureToMarkdown(
    { title: "The tour", caption: "Recorded live", video: { asset: READY } },
    {}
  );
  expect(result).toContain("![Recorded live](");
});

test("videoFeatureToMarkdown omits the still when the encode failed", () => {
  const result = videoFeatureToMarkdown(
    {
      title: "The tour",
      video: {
        asset: { playbackId: "abc123", policy: "public", status: "errored" },
      },
    },
    {}
  );
  expect(result).toBe("## The tour");
});

// Without a still there is no alt text left to carry the caption.
test("videoFeatureToMarkdown gives the caption its own line when no still renders", () => {
  const result = videoFeatureToMarkdown(
    { title: "The tour", caption: "Recorded live" },
    {}
  );
  expect(result).toBe("## The tour\n\n_Recorded live_");
});

test("videoFeatureToMarkdown does not repeat the caption under the still", () => {
  const result = videoFeatureToMarkdown(
    { title: "The tour", caption: "Recorded live", video: { asset: READY } },
    {}
  );
  expect(result).not.toContain("_Recorded live_");
});

// Sanity stores "" for a field an editor typed into and then cleared.
test("videoFeatureToMarkdown falls back to the title when the caption is empty", () => {
  const result = videoFeatureToMarkdown(
    { title: "The tour", caption: "", video: { asset: READY } },
    {}
  );
  expect(result).toContain("![The tour](");
});

// `status` is patched by a poll in the editor's browser tab, so it stalls at
// `preparing` whenever that tab closes mid-encode — the video still plays.
test("videoFeatureToMarkdown still renders a preparing asset", () => {
  const result = videoFeatureToMarkdown(
    {
      title: "The tour",
      video: {
        asset: { playbackId: "abc123", policy: "public", status: "preparing" },
      },
    },
    {}
  );
  expect(result).toContain(
    "![The tour](https://image.mux.com/abc123/thumbnail.webp?width=1200)"
  );
});

test("videoFeatureToMarkdown leaks no JSX", () => {
  const result = videoFeatureToMarkdown(
    {
      eyebrow: "Watch",
      title: "The tour",
      caption: "Live",
      video: { asset: READY },
    },
    {}
  );
  expect(result).not.toMatch(/<[A-Za-z]/);
});

test("heroToMarkdown falls back to the Mux still when no poster is set", () => {
  const result = heroToMarkdown(
    { title: "Hero", video: { light: { mux: READY } } },
    {}
  );
  expect(result).toContain(
    "![Hero](https://image.mux.com/abc123/thumbnail.webp?width=1200)"
  );
});

test("videoFeatureToMarkdown posters from the editor's chosen frame", () => {
  const result = videoFeatureToMarkdown(
    { title: "The tour", video: { asset: { ...READY, thumbTime: 12.5 } } },
    {}
  );
  expect(result).toContain(
    "https://image.mux.com/abc123/thumbnail.webp?time=12.5&width=1200"
  );
});
