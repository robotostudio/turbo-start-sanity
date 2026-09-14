import {
  buttonsField,
  imageWithAltField,
} from "@workspace/sanity-blocks/internal/schema-fields";
import { Columns2 } from "lucide-react";
import { defineField, defineType } from "sanity";

export const heroSplitSchema = defineType({
  name: "heroSplit",
  type: "object",
  title: "Hero Split",
  icon: Columns2,
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The main heading",
    }),
    defineField({
      name: "subtitle",
      type: "string",
      title: "Subtitle",
      description: "Short text under the heading",
    }),
    defineField({
      ...buttonsField,
      description: "Up to two buttons",
      validation: (Rule) => Rule.max(2),
    }),
    imageWithAltField({
      description: "The image shown beside the text",
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
    },
    prepare: ({ title, media }) => ({
      title: title || "Hero Split",
      subtitle: "Hero Split Block",
      media,
    }),
  },
});
