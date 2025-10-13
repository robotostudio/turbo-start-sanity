import { HomeIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

import { GROUP, GROUPS } from "../../utils/constant";
import { ogFields } from "../../utils/og-fields";
import { seoFields } from "../../utils/seo-fields";
import { documentSlugField, pageBuilderField } from "../common";

export const homePage = defineType({
  name: "homePage",
  type: "document",
  title: "Home Page",
  icon: HomeIcon,
  description:
    "This is where you create the main page visitors see when they first come to your website. Think of it like the front door to your online home - you can add a welcoming title, a short description, and build the page with different sections like pictures, text, and buttons.",
  groups: GROUPS,
  fields: [
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
    pageBuilderField,
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
      media: HomeIcon,
      subtitle: slug || "Home Page",
    }),
  },
});
