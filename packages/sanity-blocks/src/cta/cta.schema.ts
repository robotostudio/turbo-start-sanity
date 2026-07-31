import {
  buttonsField,
  definePortableTextField,
  logoLinkItem,
} from "@workspace/sanity-blocks/internal/schema-fields";
import { Phone } from "lucide-react";
import { defineField, defineType } from "sanity";

const usedByTeamsLogo = logoLinkItem("usedByTeamsLogo");

export const ctaSchema = defineType({
  name: "cta",
  type: "object",
  icon: Phone,
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
    definePortableTextField(["block"], {
      name: "richText",
      description:
        "The supporting paragraph shown beneath the title, explaining what visitors get if they act",
    }),
    buttonsField,
    defineField({
      name: "usedByTeams",
      type: "object",
      title: "Used By Teams",
      description:
        "Optional logo grid shown to the side of the heading, highlighting the teams or brands that use the product",
      fields: [
        defineField({
          name: "title",
          type: "string",
          title: "Title",
          description:
            'Short label displayed above the logo grid, for example "Trusted by teams at leading companies"',
        }),
        defineField({
          name: "logos",
          type: "array",
          title: "Logos",
          description: "Add the partner or brand logos to display in the grid",
          of: [usedByTeamsLogo],
        }),
      ],
    }),
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
