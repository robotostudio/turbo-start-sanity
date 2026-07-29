import {
  buttonsField,
  definePortableTextField,
} from "@workspace/sanity-blocks/internal/schema-fields";
import { Star } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * One theme's worth of background video.
 *
 * Three clips, because no single file suits every visitor: two formats cover
 * the range of devices, plus one phone-sized version. Each is optional and
 * falls back to the next, so a partial set still works — and the picture alone
 * is a valid setup.
 */
const videoVariantFields = () => [
  defineField({
    name: "webm",
    type: "file",
    title: "Video for computers",
    description: "The .webm file. Most people see this one.",
    options: { accept: "video/webm" },
  }),
  defineField({
    name: "hevc",
    type: "file",
    title: "Video for Apple devices",
    description: "The .mp4 file. Macs, iPhones and iPads need this one.",
    options: { accept: "video/mp4" },
  }),
  defineField({
    name: "mobileWebm",
    type: "file",
    title: "Video for phones",
    description:
      "A smaller .webm, so phones do not have to download the big file.",
    options: { accept: "video/webm" },
  }),
  defineField({
    name: "poster",
    type: "image",
    title: "Picture",
    description:
      "Shown while the video loads, and on its own if you add no videos. Use the very first frame of the video, so you cannot see the moment it starts playing.",
  }),
];

export const heroVideoField = defineField({
  name: "video",
  type: "object",
  title: "Background",
  description:
    "Add just a picture, or add videos too. The picture appears first, then the video fades in over it.",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "light",
      type: "object",
      title: "Light mode",
      description: "The files shown when the site is in light mode.",
      options: { collapsible: true, collapsed: false },
      fields: videoVariantFields(),
    }),
    defineField({
      name: "dark",
      type: "object",
      title: "Dark mode",
      description:
        "Optional. Leave empty and the light mode files are used here too.",
      options: { collapsible: true, collapsed: false },
      fields: videoVariantFields(),
    }),
  ],
});

export const heroSchema = defineType({
  name: "hero",
  title: "Hero",
  icon: Star,
  type: "object",
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
