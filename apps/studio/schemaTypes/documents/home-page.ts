import { defineField, defineType } from "sanity";

import { GROUP, GROUPS } from "../../utils/constant";
import { getDocumentIcon } from "../../utils/document-icons";
import { ogFields } from "../../utils/og-fields";
import { seoFields } from "../../utils/seo-fields";
import { documentSlugField, pageBuilderField } from "../common";

export const homePage = defineType({
  name: "homePage",
  type: "document",
  title: "Home Page",
  icon: getDocumentIcon("homePage"),
  description:
    "This is where you create the main page visitors see when they first come to your website. Think of it like the front door to your online home - you can add a welcoming title, a short description, and build the page with different sections like pictures, text, and buttons.",
  groups: GROUPS,
  fields: [
    pageBuilderField,
    defineField({
      name: "title",
      type: "string",
      description:
        "The main heading that will appear at the top of your home page",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      description:
        "A short summary that tells visitors what your website is about. This text also helps your page show up in Google searches.",
      rows: 3,
      group: GROUP.MAIN_CONTENT,
      validation: (rule) => [
        rule
          .min(140)
          .warning(
            "The meta description should be at least 140 characters for optimal SEO visibility in search results"
          ),
        rule
          .max(160)
          .warning(
            "The meta description should not exceed 160 characters as it will be truncated in search results"
          ),
      ],
    }),
    documentSlugField("homePage", {
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "showLatestcollections",
      title: "Show Latest collection(s) on Homepage?",
      type: "boolean",
      initialValue: true,
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      group: GROUP.MAIN_CONTENT,
      name: "latestcollectionsOffset",
      title: "How many collections are on-view currently?",
      type: "number",
      options: {
        layout: "radio",
        direction: "horizontal",
        list: [
          { title: "1 collection", value: 1 },
          { title: "2 collections", value: 2 },
        ],
      },
      initialValue: 1,
      validation: (Rule) => Rule.min(1).max(2),
      hidden: ({ parent }) => !parent?.showLatestcollections,
    }),
    ...seoFields.filter(
      (field) => !["seoNoIndex", "seoHideFromLists"].includes(field.name)
    ),
    ...ogFields,
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug.current",
    },
    prepare: ({ title, slug }) => ({
      title: title || "Untitled Home Page",
      media: getDocumentIcon("homePage"),
      subtitle: slug || "Home Page",
    }),
  },
});
