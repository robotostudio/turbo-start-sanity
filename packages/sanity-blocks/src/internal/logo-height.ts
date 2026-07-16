type NormalizeOptions = {
  base: number;
  min: number;
  max: number;
};

// Parse the aspect ratio straight from the Sanity asset id
// (`image-<hash>-<width>x<height>-<format>`). Kept inline (rather than reusing
// getImageDimensions) so this stays a plain, server-safe function — the image
// helpers live in a "use client" module and can't be called from a Server
// Component like the footer.
function aspectRatioFromId(
  image: { id?: string | null } | null | undefined
): number | null {
  const id = image?.id;
  if (typeof id !== "string") {
    return null;
  }
  const match = id.match(/-(\d+)x(\d+)-/);
  if (!match) {
    return null;
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!(width > 0 && height > 0)) {
    return null;
  }
  return width / height;
}

// The "logo soup" fix (sanity.io/blog/the-logo-soup-problem): sizing every logo
// to one fixed height makes wide wordmarks dominate and square marks look tiny.
// Normalize by AREA instead — height = base / sqrt(aspectRatio) — so a wide
// wordmark sits shorter and a square mark taller, giving each roughly equal
// visual weight. Clamped so extreme ratios stay legible. Shared by the logo
// cloud marquee, the CTA "used by teams" grid, and the footer credits.
export function normalizedLogoHeight(
  image: { id?: string | null } | null | undefined,
  { base, min, max }: NormalizeOptions
): number {
  const aspectRatio = aspectRatioFromId(image);
  if (!aspectRatio) {
    return base;
  }
  const height = base / Math.sqrt(aspectRatio);
  return Math.round(Math.min(max, Math.max(min, height)));
}
