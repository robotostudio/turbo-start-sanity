type NormalizeOptions = {
  base: number;
  min: number;
  max: number;
};

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
