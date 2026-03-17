import { definePortableTextField } from "@workspace/sanity-blocks/internal/schema-fields";
import { TextIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

export const richTextBlockSchema = defineType({
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
    definePortableTextField(["block", "image"], {
      name: "richText",
    }),
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
