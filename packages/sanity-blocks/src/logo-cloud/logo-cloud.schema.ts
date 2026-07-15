import { ImagesIcon } from "@sanity/icons";
import { imageWithAltField } from "@workspace/sanity-blocks/internal/schema-fields";
import { defineArrayMember, defineField, defineType } from "sanity";

const logoCloudItem = defineArrayMember({
  name: "logoCloudItem",
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

export const logoCloudSchema = defineType({
  name: "logoCloud",
  type: "object",
  icon: ImagesIcon,
  title: "Logo Cloud",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description:
        'Optional short label displayed above the logos, for example "Used by teams"',
    }),
    defineField({
      name: "logos",
      title: "Logos",
      type: "array",
      description: "Add the partner or brand logos to display in the row",
      of: [logoCloudItem],
    }),
  ],
  preview: {
    select: {
      logos: "logos",
      title: "title",
    },
    prepare: ({ logos = [], title }) => {
      const logoCount = logos.length;
      const logoLabel = logoCount === 1 ? "logo" : "logos";

      return {
        title: title || "Logo Cloud",
        subtitle: `${logoCount} ${logoLabel}`,
      };
    },
  },
});
