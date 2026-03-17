import {
  buttonsField,
  definePortableTextField,
} from "@workspace/sanity-blocks/internal/schema-fields";
import { PhoneIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

export const ctaSchema = defineType({
  name: "cta",
  type: "object",
  icon: PhoneIcon,
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
    definePortableTextField(["block"], {
      name: "richText",
    }),
    buttonsField,
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

// Backward-compat alias (remove in next major)
export const cta = ctaSchema;
