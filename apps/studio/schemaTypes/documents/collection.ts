import { orderRankField } from "@sanity/orderable-document-list";
import { defineField, defineType, type PreviewConfig } from "sanity";

import { GROUP, GROUPS } from "../../utils/constant";
import { getDocumentIcon } from "../../utils/document-icons";
import { ogFields } from "../../utils/og-fields";
import { seoFields } from "../../utils/seo-fields";
import {
  createDocumentPreview,
  documentSlugField,
  pageBuilderField,
} from "../common";
import { imageWithCaption } from "../definitions/image-with-caption";
import { limitedRichText } from "../definitions/rich-text";

export const collection = defineType({
  name: "collection",
  title: "collection",
  type: "document",
  icon: getDocumentIcon("collection"),
  groups: GROUPS,
  orderings: [
    {
      title: "Newest First",
      name: "newestFirst",
      by: [{ field: "startDate", direction: "desc" }],
    },
    {
      title: "Oldest First",
      name: "oldestFirst",
      by: [{ field: "startDate", direction: "asc" }],
    },
  ],
  fieldsets: [
    {
      name: "dates",
      title: "Dates",
      options: {
        collapsible: true,
        columns: 2,
      },
    },
    {
      name: "migration",
      title: "Migration",
      options: {
        collapsed: true,
      },
    },
  ],
  fields: [
    orderRankField({ type: "collection" }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The title of the collection",
      group: GROUP.MAIN_CONTENT,
      validation: (Rule) =>
        Rule.required().error("A collection title is required"),
    }),
    defineField({
      name: "description",
      type: "text",
      title: "Description",
      description:
        "A brief summary of what this collection is about. This text helps search engines understand your collection and may appear in search results.",
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
    documentSlugField("collection", {
      group: GROUP.MAIN_CONTENT,
      prefix: "collections",
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Image",
      description:
        "A main picture for this collection that can be used when sharing on social media or in search results",
      group: GROUP.MAIN_CONTENT,
      options: {
        hotspot: true,
      },
    }),
    pageBuilderField,

    ...seoFields.filter((field) => field.name !== "seoHideFromLists"),
    ...ogFields,
  ],
  preview: createDocumentPreview({
    defaultTitle: "...",
    privateStatusEmoji: "[Private]",
    publicStatusEmoji: "",
    builderEmojiWithCount: (count: number) => `(${count})`,
    builderEmojiEmpty: "...",
  }) as PreviewConfig,
});
