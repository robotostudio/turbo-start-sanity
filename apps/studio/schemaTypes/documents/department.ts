import { Briefcase } from "lucide-react";
import { defineField, defineType } from "sanity";

import { GROUP, GROUPS } from "../../utils/constant";
import { seoFields } from "../../utils/seo-fields";
import { createSlug, isUniqueForLanguage } from "../../utils/slug";

export const department = defineType({
  name: "department",
  type: "document",
  title: "Department",
  icon: Briefcase,
  groups: GROUPS,
  fields: [
    defineField({
      name: "language",
      type: "string",
      title: "Language",
      description: "The language of this department",
      group: GROUP.MAIN_CONTENT,
      readOnly: true,
      hidden: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description:
        "The name of the department (e.g., 'Engineering', 'Marketing', 'Finance')",
      group: GROUP.MAIN_CONTENT,
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "URL",
      description: "The web address for this department",
      group: GROUP.MAIN_CONTENT,
      options: {
        source: "title",
        slugify: createSlug,
        isUnique: isUniqueForLanguage,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      title: "Description",
      description: "A brief description of what this department covers",
      group: GROUP.MAIN_CONTENT,
      rows: 3,
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: "icon",
      type: "string",
      title: "Icon",
      description: "Icon name for this department (optional)",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "color",
      type: "string",
      title: "Color",
      description: "Color theme for this department (optional)",
      group: GROUP.MAIN_CONTENT,
      options: {
        list: [
          { title: "Blue", value: "blue" },
          { title: "Green", value: "green" },
          { title: "Purple", value: "purple" },
          { title: "Orange", value: "orange" },
          { title: "Red", value: "red" },
          { title: "Gray", value: "gray" },
        ],
      },
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      title: "Active",
      description:
        "Whether this department is currently active and accepting new jobs",
      group: GROUP.MAIN_CONTENT,
      initialValue: true,
    }),
    ...seoFields,
  ],
  preview: {
    select: {
      title: "title",
      description: "description",
      isActive: "isActive",
    },
    prepare({ title, description, isActive }) {
      return {
        title: title,
        subtitle: `${description || "No description"} • ${isActive ? "Active" : "Inactive"}`,
        media: Briefcase,
      };
    },
  },
  orderings: [
    {
      title: "Title A-Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
    {
      title: "Title Z-A",
      name: "titleDesc",
      by: [{ field: "title", direction: "desc" }],
    },
    {
      title: "Created Date",
      name: "createdDesc",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
  ],
});
