import { ImageIcon } from "@sanity/icons";
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";

import { imageWithAltField } from "@/schemaTypes/common";

export const showcaseItem = defineType({
  name: "showcaseItem",
  title: "Showcase Item",
  type: "document",
  icon: ImageIcon,
  orderings: [orderRankOrdering],
  description:
    "A single website featured on the showcase page. Add its screenshot, live URL, and credit. Drag to reorder items and mark one as 'Featured' to show it in the large card at the top.",
  fields: [
    orderRankField({ type: "showcaseItem" }),
    defineField({
      name: "siteName",
      type: "string",
      title: "Site Name",
      description:
        "The name of the website or project being shown (for example: 'Volvo Chile').",
      validation: (Rule) => Rule.required().error("A site name is required"),
    }),
    defineField({
      name: "url",
      type: "url",
      title: "URL",
      description:
        "The full web address of the live site, including https://. Used to link the screenshot to the real website.",
    }),
    imageWithAltField({
      name: "screenshot",
      title: "Screenshot",
      description:
        "A screenshot of the website's homepage. This is the main image shown in the card.",
    }),
    defineField({
      name: "attributionName",
      type: "string",
      title: "Attribution Name",
      description:
        "The person, brand, or company credited for the site, shown next to the screenshot.",
    }),
    imageWithAltField({
      name: "attributionLogo",
      title: "Attribution Logo",
      description:
        "An optional small logo or mark for the credited person or brand. Leave empty to show their initials instead.",
    }),
    defineField({
      name: "builtByRoboto",
      type: "boolean",
      title: "Built by Roboto",
      description:
        "Turn this on to show a 'Built by Roboto' badge on the card, indicating we built this site.",
      initialValue: false,
    }),
    defineField({
      name: "featured",
      type: "boolean",
      title: "Featured",
      description:
        "Turn this on to show this site in the large featured card at the top of the page. If more than one is marked, only the first is used.",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "siteName",
      subtitle: "attributionName",
      media: "screenshot",
    },
    prepare: ({ title, subtitle, media }) => ({
      title: title || "Untitled site",
      subtitle: subtitle || "Showcase item",
      media,
    }),
  },
});
