import { defineField } from "sanity";

import { GROUP } from "@/utils/constant";

export const ogFields = [
  defineField({
    name: "ogTitle",
    type: "string",
    title: "Open Graph Title Override",
    description:
      "This will override the open graph title. If left blank it will inherit the page title.",
    validation: (Rule) => Rule.warning("A page title is required"),
    group: GROUP.OG,
  }),
  defineField({
    name: "ogDescription",
    type: "text",
    title: "Open Graph Description Override",
    description:
      "This will override the meta description. If left blank it will inherit the description from the page description.",
    rows: 2,
    validation: (Rule) => [
      Rule.warning("A description is required"),
      Rule.max(160).warning("No more than 160 characters"),
    ],
    group: GROUP.OG,
  }),
];
