const ogImageDimensions = {
  width: 1200,
  height: 630,
};

export const getOgMetaData = (searchParams: URLSearchParams) => {
  const width = searchParams.get("width") as string;
  const height = searchParams.get("height") as string;

  const ogWidth = Number.isNaN(Number.parseInt(width, 10))
    ? ogImageDimensions.width
    : Number.parseInt(width, 10);

  const ogHeight = Number.isNaN(Number.parseInt(height, 10))
    ? ogImageDimensions.height
    : Number.parseInt(height, 10);

  return { width: ogWidth, height: ogHeight };
};
