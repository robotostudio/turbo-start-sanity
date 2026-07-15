import { ImagesIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

import { documentSlugField } from "@/schemaTypes/common";

export const showcasePage = defineType({
  name: "showcasePage",
  type: "document",
  title: "Showcase Page",
  icon: ImagesIcon,
  description:
    "This is the page that shows off real websites built with the template. Set the headline and intro text at the top. The sites themselves are managed as individual Showcase Item documents.",
  fields: [
    defineField({
      name: "headline",
      type: "string",
      description:
        "The large heading shown at the top of the showcase page (for example: 'Real sites. Real traffic. Same starting point as yours.').",
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      description:
        "The short paragraph shown under the headline that explains what the showcase is about.",
    }),
    documentSlugField("showcasePage"),
  ],
  preview: {
    select: {
      title: "headline",
      slug: "slug.current",
    },
    prepare: ({ title, slug }) => ({
      title: title || "Showcase Page",
      subtitle: slug || "Showcase Page",
    }),
  },
});
