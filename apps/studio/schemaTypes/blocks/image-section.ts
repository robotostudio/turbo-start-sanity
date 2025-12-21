import {ImageIcon} from "@sanity/icons";
import {defineField, defineType} from "sanity";

import {createRadioListLayout} from "../../utils/helper";

type SanityImage = {
  asset: {
    _ref: string;
  };
};

export const imageSection = defineType({
  name: "imageSection",
  title: "Image Section",
  type: "object",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      description: "The image to display in this section",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "styleVariant",
      title: "Style Variant",
      type: "string",
      description:
        "Choose how the image should be displayed - full bleed extends to the edges, fit to container maintains aspect ratio within the container",
      initialValue: () => "fitToContainer",
      options: createRadioListLayout([
        "default",
        "inset",
        "fullBleed",
        "fullViewport",
      ]),
    }),
    defineField({
      name: "alt",
      title: "Alt Text",
      type: "string",
      description:
        "Alternative text for the image, important for accessibility and SEO",
    }),
  ],
  preview: {
    select: {
      media: "image",
      styleVariant: "styleVariant",
      alt: "alt",
    },
    prepare: ({media, styleVariant, alt}) => ({
      title: alt || "Image Section",
      subtitle:
        styleVariant === "fullBleed" ? "Full Bleed" : "Fit to Container",
      media,
    }),
  },
});
