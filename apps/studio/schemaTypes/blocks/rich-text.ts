import { TextIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

import { customRichText } from "@/schemaTypes/definitions/rich-text";

export const richTextBlock = defineType({
  name: "richTextBlock",
  type: "object",
  icon: TextIcon,
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      description:
        "The smaller text that sits above the title to provide context",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The large text that is the primary focus of the block",
    }),
    customRichText(["block", "image"]),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare: ({ title }) => ({
      title: title || "Rich Text",
      subtitle: "Rich Text Block",
    }),
  },
});
