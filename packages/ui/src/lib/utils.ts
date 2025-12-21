import {
  createImageUrlBuilder,
  type SanityClientConfig,
  type SanityClientLike,
} from "@sanity/image-url";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const imageUrlBuilder = (clientConfig: SanityClientConfig) =>
  createImageUrlBuilder(clientConfig as SanityClientLike);

export function urlForImage(source: { asset: { _ref: string } }, clientConfig?: SanityClientConfig) {
  return imageUrlBuilder(clientConfig || {}).image(source);
  // This is a placeholder function. In a real application, you would use
  // your image URL builder logic here, such as Sanity's image URL builder.
}
