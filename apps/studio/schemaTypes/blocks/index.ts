import { collectionListing } from "./collection-listing";
import { gridLayout } from "./grid-layout";
import { imageGallery } from "./image-gallery";
import { imageSection } from "./image-section";
import { textSection } from "./text-section";
import { videoSection } from "./video-section";

export const pageBuilderBlocks = [
  // basic
  textSection,
  // media
  imageSection,
  imageGallery,
  videoSection,
  // dynamic content
  collectionListing,
  // freeform
  gridLayout,
];
