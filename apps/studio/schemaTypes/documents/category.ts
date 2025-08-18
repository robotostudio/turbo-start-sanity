// /schemas/category.ts
import { defineType, defineField } from "sanity";

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
    }),
    // custom SEO
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      fields: [
        { name: "seoTitle", title: "SEO Title", type: "string" },
        { name: "seoDescription", title: "SEO Description", type: "text" },
      ],
    }),
  ],
});
