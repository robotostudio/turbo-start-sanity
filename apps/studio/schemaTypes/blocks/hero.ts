import { Star } from "lucide-react";
import { defineField, defineType } from "sanity";

import { buttonsField } from "../common";
import { customRichText } from "../definitions/rich-text";

export const hero = defineType({
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
    customRichText(["block"]),
    defineField({
      name: "image",
      type: "image",
      title: "Image",
      description:
        "The main hero image - should be high quality and visually impactful",
      options: {
        hotspot: true,
      },
    }),
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
