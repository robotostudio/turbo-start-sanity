import { definePortableTextField } from "@workspace/sanity-blocks/internal/schema-fields";
import { Text } from "lucide-react";
import { defineField, defineType } from "sanity";

export const richTextBlockSchema = defineType({
  name: "richTextBlock",
  type: "object",
  icon: Text,
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      title: "Eyebrow",
      description:
        "The smaller text that sits above the title to provide context",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The large text that is the primary focus of the block",
    }),
    definePortableTextField(["block", "image", "table"], {
      name: "richText",
      description:
        "The body content for this block. Add paragraphs, headings, lists, links, images and tables.",
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
