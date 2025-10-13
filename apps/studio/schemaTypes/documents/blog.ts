import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";
import { FileTextIcon } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

import { GROUP, GROUPS } from "../../utils/constant";
import { ogFields } from "../../utils/og-fields";
import { seoFields } from "../../utils/seo-fields";
import { documentSlugField } from "../common";

export const blog = defineType({
  name: "blog",
  title: "Blog",
  type: "document",
  icon: FileTextIcon,
  groups: GROUPS,
  orderings: [orderRankOrdering],
  description:
    "A blog post that will be published on the website. Add a title, description, author, and content to create a new article for readers.",
  fields: [
    orderRankField({ type: "blog" }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The headline of your blog post that readers will see first",
      group: GROUP.MAIN_CONTENT,
      validation: (Rule) => Rule.required().error("A blog title is required"),
    }),
    defineField({
      title: "Description",
      name: "description",
      type: "text",
      rows: 3,
      description:
        "A short summary of what your blog post is about (appears in search results)",
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
    documentSlugField("blog", {
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "authors",
      type: "array",
      title: "Authors",
      description: "Who wrote this blog post (select from existing authors)",
      of: [
        defineArrayMember({
          type: "reference",
          to: [
            {
              type: "author",
              options: {
                disableNew: true,
              },
            },
          ],
          options: {
            disableNew: true,
          },
        }),
      ],
      validation: (Rule) => [
        Rule.required(),
        Rule.max(1),
        Rule.min(1),
        Rule.unique(),
      ],
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "publishedAt",
      type: "date",
      initialValue: () => new Date().toISOString().split("T")[0],
      title: "Published At",
      description:
        "The date when your blog post will appear to have been published",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "image",
      title: "Image",
      description:
        "The main picture that will appear at the top of your blog post and in previews",
      type: "image",
      group: GROUP.MAIN_CONTENT,
      validation: (Rule) => Rule.required(),
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "richText",
      type: "richText",
      description:
        "The main content of your blog post with text, images, and formatting",
      group: GROUP.MAIN_CONTENT,
    }),
    ...seoFields,
    ...ogFields,
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
      isPrivate: "seoNoIndex",
      isHidden: "seoHideFromLists",
      slug: "slug.current",
      author: "authors.0.name",
      publishDate: "publishedAt",
    },
    prepare: ({
      title,
      media,
      isPrivate,
      isHidden,
      author,
      slug,
      publishDate,
    }) => {
      // Status indicators
      let visibility = "🌎 Public";
      if (isPrivate) {
        visibility = "🔒 Private";
      } else if (isHidden) {
        visibility = "🙈 Hidden";
      }

      // Author and date
      const authorInfo = author ? `✍️ ${author}` : "👻 No author";
      const dateInfo = publishDate
        ? `📅 ${new Date(publishDate).toLocaleDateString()}`
        : "⏳ Draft";

      return {
        title: title || "Untitled Blog",
        media,
        subtitle: `🔗 ${slug} | ${visibility} | ${authorInfo} | ${dateInfo}`,
      };
    },
  },
});
