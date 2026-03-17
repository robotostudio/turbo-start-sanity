import { lucideIconPreview } from "@workspace/sanity-blocks/internal/lucide-icon-preview";
import {
  definePortableTextField,
  iconField,
} from "@workspace/sanity-blocks/internal/schema-fields";
import { LayoutGrid } from "lucide-react";
import { defineField, defineType } from "sanity";

const featureCardIconItem = defineField({
  name: "featureCardIcon",
  type: "object",
  fields: [
    iconField,
    defineField({
      name: "title",
      type: "string",
      description: "The heading text for this feature card",
    }),
    definePortableTextField(["block"], {
      name: "richText",
    }),
  ],
  preview: {
    select: {
      title: "title",
      icon: "icon",
    },
    prepare: ({ icon, title }) => ({
      title: title ?? "Untitled",
      media: lucideIconPreview(icon),
    }),
  },
});

export const featureCardsIconSchema = defineType({
  name: "featureCardsIcon",
  type: "object",
  icon: LayoutGrid,
  description:
    "A grid of feature cards, each with an icon, title and description",
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Optional text that appears above the main title",
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The main heading for this feature section",
    }),
    definePortableTextField(["block"], {
      name: "richText",
    }),
    defineField({
      name: "cards",
      type: "array",
      description: "The individual feature cards to display in the grid",
      of: [featureCardIconItem],
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare: ({ title }) => ({
      title,
      subtitle: "Feature Cards with Icon",
    }),
  },
});
