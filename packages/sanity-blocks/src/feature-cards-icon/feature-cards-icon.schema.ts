import { lucideIconPreview } from "@workspace/sanity-blocks/internal/lucide-icon-preview";
import {
  definePortableTextField,
  iconField,
} from "@workspace/sanity-blocks/internal/schema-fields";
import { LayoutGrid } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const featureCardIconItem = defineArrayMember({
  name: "featureCardIcon",
  type: "object",
  fields: [
    iconField,
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The heading text for this feature card",
    }),
    definePortableTextField(["block"], {
      name: "richText",
      description: "The short description shown beneath this card's heading",
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
  description:
    "A grid of feature cards, each with an icon, title and description",
  icon: LayoutGrid,
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      title: "Eyebrow",
      description: "Optional text that appears above the main title",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The main heading for this feature section",
    }),
    definePortableTextField(["block"], {
      name: "richText",
      description:
        "The supporting paragraph shown beneath the title, introducing the cards below",
    }),
    defineField({
      name: "cards",
      type: "array",
      title: "Cards",
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
