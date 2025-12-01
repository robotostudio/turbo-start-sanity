import { ImagesIcon } from "lucide-react";
import { defineField, defineType } from "sanity";
import { createRadioListLayout } from "../../utils/helper";
import { schemaIcon } from "../../utils/icon-wrapper";
import { imageWithCaption } from "../definitions/image-with-caption";

export const imageGallery = defineType({
  name: "imageGallery",
  title: "Image Gallery",
  type: "object",
  icon: schemaIcon(ImagesIcon),
  fields: [
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      description: "Add images to display in the gallery",
      of: [imageWithCaption],
    }),
    defineField({
      name: "columnVariant",
      title: "Column Variant",
      type: "string",
      description: "Choose how many columns the gallery should flow across",
      initialValue: () => "single",
      options: createRadioListLayout(["single", "two", "three"]),
    }),
  ],
  preview: {
    select: {
      columnVariant: "columnVariant",
      images: "images",
      firstImage: "images.0.image",
    },
    prepare: ({ columnVariant, images, firstImage }) => ({
      title:
        Object.keys(images).length > 0
          ? `${Object.keys(images).length} images`
          : "Image Gallery",
      subtitle: `${columnVariant.slice(0, 1).toUpperCase() + columnVariant.slice(1)} column${columnVariant === "single" ? "" : "s"}`,
      media: firstImage,
    }),
  },
});
