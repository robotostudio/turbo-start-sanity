import type { SanityImageSource } from "@sanity/asset-utils";
import createImageUrlBuilder from "@sanity/image-url";
import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId, studioUrl } from "../../config";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
  perspective: "published",
  stega: {
    studioUrl,
    enabled: process.env.NEXT_PUBLIC_VERCEL_ENV === "preview",
  },
});

const imageBuilder = createImageUrlBuilder({
  projectId,
  dataset,
});

export const urlFor = (source: SanityImageSource) =>
  imageBuilder.image(source).auto("format").fit("max").format("webp");
