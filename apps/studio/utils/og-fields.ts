import { defineField } from "sanity";

import { GROUP } from "@/utils/constant";

export const ogFields = [
  defineField({
    name: "ogTitle",
    title: "Open graph title override",
    description:
      "This will override the open graph title. If left blank it will inherit the page title.",
    type: "string",
    validation: (Rule) => Rule.warning("A page title is required"),
    group: GROUP.OG,
  }),
  defineField({
    name: "ogDescription",
    title: "Open graph description override",
    description:
      "This will override the meta description. If left blank it will inherit the description from the page description.",
    type: "text",
    rows: 2,
    validation: (Rule) => [
      Rule.warning("A description is required"),
      Rule.max(160).warning("No more than 160 characters"),
    ],
    group: GROUP.OG,
  }),
];
