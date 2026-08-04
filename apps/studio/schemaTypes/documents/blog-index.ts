import { BookMarked } from "lucide-react";
import { defineField, defineType } from "sanity";

import { documentSlugField, pageBuilderField } from "@/schemaTypes/common";
import { GROUP, GROUPS } from "@/utils/constant";
import { ogFields } from "@/utils/og-fields";
import { seoFields } from "@/utils/seo-fields";

export const blogIndex = defineType({
  name: "blogIndex",
  type: "document",
  title: "Blog Listing Page",
  description:
    "This is the main page that shows all your blog posts. You can customize how your blog listing page looks, what title it has, and which blog post you want to highlight at the top.",
  icon: BookMarked,
  groups: GROUPS,
  fields: [
    defineField({
      name: "title",
      type: "string",
      description:
        "The main heading that will appear at the top of your blog listing page",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "description",
      type: "text",
      description:
        "A short summary of what visitors can find on your blog. This helps people understand what your blog is about.",
      group: GROUP.MAIN_CONTENT,
    }),
    documentSlugField("blogIndex", {
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
      description: "description",
      slug: "slug.current",
    },
    prepare: ({ title, description, slug }) => ({
      title: title || "Untitled Blog Index",
      subtitle: description || slug || "Blog Index",
    }),
  },
});
