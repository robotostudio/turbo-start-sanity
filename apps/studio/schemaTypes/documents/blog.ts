import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";
import { FileTextIcon } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

import { PathnameFieldComponent } from "../../components/slug-field-component";
import { GROUP, GROUPS } from "../../utils/constant";
import { ogFields } from "../../utils/og-fields";
import { seoFields } from "../../utils/seo-fields";
import { createSlug, isUnique } from "../../utils/slug";

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
            "The meta description should be at least 140 characters for optimal SEO visibility in search results",
          ),
        rule
          .max(160)
          .warning(
            "The meta description should not exceed 160 characters as it will be truncated in search results",
          ),
      ],
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "URL",
      description:
        "The web address where people can find your blog post (automatically created from title)",
      group: GROUP.MAIN_CONTENT,
      components: {
        field: PathnameFieldComponent,
      },
      options: {
        source: "title",
        slugify: createSlug,
        isUnique,
      },
      validation: (Rule) => [
        Rule.required().error("A URL slug is required"),
        Rule.custom((value, context) => {
          if (!value?.current) return true;
          if (!value.current.startsWith("/blog/")) {
            return 'URL slug must start with "/blog/"';
          }
          return true;
        }),
      ],
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
      name: "featuredPokemon",
      title: "Featured Pokémon",
      type: "reference",
      to: [{ type: "pokedex" }], // Reference to pokedex documents
      options: {
        disableNew: true, // Force selection from existing Pokémon
      },
    }),

    defineField({
      name: "richText",
      type: "richText",
      description:
        "The main content of your blog post with text, images, and formatting",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
      validation: (rule) => rule.min(1).error("At least one category required"),
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
      slug,
      isPrivate,
      isHidden,
      author,
      publishDate,
    }) => {
      // Status indicators
      const visibility = isPrivate
        ? "🔒 Private"
        : isHidden
          ? "🙈 Hidden"
          : "🌎 Public";

      // Author and date
      const authorInfo = author ? `✍️ ${author}` : "👻 No author";
      const dateInfo = publishDate
        ? `📅 ${new Date(publishDate).toLocaleDateString()}`
        : "⏳ Draft";

      return {
        title: title || "Untitled Blog",
        media,
        subtitle: `${visibility} | ${authorInfo} | ${dateInfo}`,
      };
    },
  },
});
