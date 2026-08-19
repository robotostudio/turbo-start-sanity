import {
  buttonsField,
  definePortableTextField,
  muxVideoField,
} from "@workspace/sanity-blocks/internal/schema-fields";
import { Star } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * One theme's worth of background: a single upload, encoded for every device,
 * so no format matrix. The picture covers the load, stands alone when there is
 * no video, and falls back to the clip's own opening frame when skipped.
 */
const videoVariantFields = () => [
  muxVideoField({
    name: "mux",
    title: "Video",
    description:
      "Upload one video. It is optimised for every device automatically.",
  }),
  defineField({
    name: "poster",
    type: "image",
    title: "Picture",
    description:
      "Optional. Shown while the video loads, or on its own if you add no video.",
  }),
];

export const heroVideoField = defineField({
  name: "video",
  type: "object",
  title: "Background",
  description: "Add a video. If you have no video, add a picture instead.",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "light",
      type: "object",
      title: "Light Mode",
      description: "Shown in light mode.",
      options: { collapsible: true, collapsed: false },
      fields: videoVariantFields(),
    }),
    defineField({
      name: "dark",
      type: "object",
      title: "Dark Mode",
      description: "Optional. Leave empty to reuse the light mode background.",
      options: { collapsible: true, collapsed: false },
      fields: videoVariantFields(),
    }),
  ],
});

export const heroSchema = defineType({
  name: "hero",
  type: "object",
  title: "Hero",
  icon: Star,
  fields: [
    defineField({
      name: "badge",
      type: "string",
      title: "Badge",
      description:
        "Optional badge text displayed above the title, useful for highlighting new features or promotions",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description:
        "The main heading text for the hero section that captures attention",
    }),
    definePortableTextField(["block"], {
      name: "richText",
      description:
        "The supporting paragraph shown beneath the title, introducing the page in a sentence or two",
    }),
    heroVideoField,
    buttonsField,
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare: ({ title }) => ({
      title,
      subtitle: "Hero Block",
    }),
  },
});
