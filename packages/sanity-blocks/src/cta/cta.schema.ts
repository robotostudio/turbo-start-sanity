import { ImagesIcon } from "@sanity/icons";
import {
  buttonsField,
  definePortableTextField,
  imageWithAltField,
} from "@workspace/sanity-blocks/internal/schema-fields";
import { PhoneIcon } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const usedByTeamsLogo = defineArrayMember({
  name: "usedByTeamsLogo",
  type: "object",
  icon: ImagesIcon,
  fields: [
    imageWithAltField({
      title: "Logo",
      description:
        "The partner or brand logo to display. Use a transparent PNG or SVG for the cleanest result",
    }),
    defineField({
      name: "url",
      title: "Link URL",
      type: "customUrl",
      description:
        "Optional link opened when a visitor clicks this logo, for example the brand's website",
    }),
  ],
  preview: {
    select: {
      media: "image",
      alt: "image.alt",
      externalUrl: "url.external",
      internalUrl: "url.internal.slug.current",
      urlType: "url.type",
    },
    prepare: ({ media, alt, externalUrl, internalUrl, urlType }) => {
      const url = urlType === "external" ? externalUrl : internalUrl;

      return {
        title: alt || "Logo",
        subtitle: url || "No link",
        media,
      };
    },
  },
});

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
    defineField({
      name: "usedByTeams",
      title: "Used By Teams",
      type: "object",
      description:
        "Optional logo grid shown to the side of the heading, highlighting the teams or brands that use the product",
      fields: [
        defineField({
          name: "title",
          title: "Title",
          type: "string",
          description:
            'Short label displayed above the logo grid, for example "Used by teams on Turbo Start Sanity"',
        }),
        defineField({
          name: "logos",
          title: "Logos",
          type: "array",
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

// Backward-compat alias (remove in next major)
export const cta = ctaSchema;
