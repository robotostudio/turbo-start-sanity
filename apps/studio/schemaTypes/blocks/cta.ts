import { PhoneIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

import { PageBuilderBlockInput } from "@/components/generate-thumbnail";
import { buttonsField, previewThumbnail } from "@/schemaTypes/common";
import { customRichText } from "@/schemaTypes/definitions/rich-text";

export const cta = defineType({
  name: "cta",
  type: "object",
  icon: PhoneIcon,
  components: {
    input: PageBuilderBlockInput,
  },
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
    customRichText(["block"]),
    buttonsField,
    previewThumbnail,
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare: ({ title }) => ({
      title,
      subtitle: "CTA Block",
    }),
  },
});
