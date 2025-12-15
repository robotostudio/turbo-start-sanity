import { defineField, defineType } from "sanity";

import { GROUP, GROUPS } from "../../utils/constant";
import { ogFields } from "../../utils/og-fields";
import { seoFields } from "../../utils/seo-fields";
import { documentSlugField, pageBuilderField } from "../common";

export const collectionIndex = defineType({
  name: "collectionIndex",
  type: "document",
  title: "collection Listing Page",
  groups: GROUPS,
  fields: [
    defineField({
      name: "title",
      type: "string",
      description:
        "The main heading that will appear at the top of your collections listing page",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "description",
      type: "text",
      description:
        "A short summary of what visitors can find in your collections. This helps people understand what your collections are about.",
      group: GROUP.MAIN_CONTENT,
    }),
    documentSlugField("collectionIndex", {
      group: GROUP.MAIN_CONTENT,
      prefix: "collections",
    }),
    defineField({
      group: GROUP.MAIN_CONTENT,
      name: 'listcollections',
      title: 'List all collections on this page?',
      type: 'boolean',
      initialValue: true,
    }),
    pageBuilderField,
    ...seoFields.filter(
      (field) => !["seoNoIndex", "seoHideFromLists"].includes(field.name)
    ),
    ...ogFields,
  ],
  preview: {
    select: {
      title: "title",
      description: "description",
      slug: "slug.current",
    },
    prepare: ({ title, description, slug }) => ({
      title: title || "[No Title]",
      subtitle: description || slug || "collections Index",
    }),
  },
});

