import {orderRankField} from "@sanity/orderable-document-list";
import {defineField, defineType, type PreviewConfig} from "sanity";
import {GROUP, GROUPS} from "../../utils/constant";
import {getDocumentIcon} from "../../utils/document-icons";
import {ogFields} from "../../utils/og-fields";
import {seoFields} from "../../utils/seo-fields";
import {createDocumentPreview, documentSlugField} from "../common";
import {imageWithCaption} from "../definitions/image-with-caption";
import { limitedRichText } from '../definitions/rich-text';

export const exhibition = defineType({
  name: "exhibition",
  title: "Exhibition",
  type: "document",
  icon: getDocumentIcon("exhibition"),
  groups: GROUPS,
  orderings: [
    {
      title: "Newest First",
      name: "newestFirst",
      by: [{field: "startDate", direction: "desc"}],
    },
    {
      title: "Oldest First",
      name: "oldestFirst",
      by: [{field: "startDate", direction: "asc"}],
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
    orderRankField({type: "exhibition"}),
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
    documentSlugField("exhibition", {
      group: GROUP.MAIN_CONTENT,
      prefix: "exhibitions",
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Image",
      description:
        "A main picture for this exhibition that can be used when sharing on social media or in search results",
      group: GROUP.MAIN_CONTENT,
      options: {
        hotspot: true,
      },
    }),
    defineField({
      fieldset: "dates",
      name: "startDate",
      type: "date",
      title: "Start Date",
      description: "The starting date of the exhibition",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      fieldset: "dates",
      name: "endDate",
      type: "date",
      title: "End Date",
      description: "The ending date of the exhibition",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      group: GROUP.MAIN_CONTENT,
      name: "gallery",
      title: "Gallery",
      description: "Leave this blank if the exhibition is in both galleries",
      type: "string",
      options: {
        layout: "radio",
        direction: "horizontal",
        list: [
          {title: "Gallery A", value: "Gallery A"},
          {title: "Gallery B", value: "Gallery B"},
        ],
      },
    }),
    defineField({
      group: GROUP.MAIN_CONTENT,
      name: "artists",
      title: "Artists",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{type: "artist"}],
        },
      ],
    }),
    limitedRichText({
      name: "pressRelease",
      title: "Press Release",
      description:
        "The press release for this exhibition. If provided, it will replace the body content on the exhibition page.",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "artistBioInPressRelease",
      title: "Artist Bio in Press Release?",
      type: "boolean",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [imageWithCaption],
      group: GROUP.MAIN_CONTENT,
    }),
    // pageBuilderField,
    defineField({
      name: "body",
      title: "Body",
      type: "richText",
      hidden: ({document}) => Boolean(document?.pressRelease),
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      fieldset: "migration",
      name: "url",
      title: "URL",
      type: "url",
      readOnly: true,
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      fieldset: "migration",
      readOnly: true,
      name: "artistRaw",
      title: "Artist Raw",
      type: "string",
      group: GROUP.MAIN_CONTENT,
    }),
    // defineField({
    //   fieldset: "migration",
    //   name: "rawBody",
    //   title: "Raw Body",
    //   type: "string",
    //   options: {
    //     wordWrap: true,
    //   } as Record<string, unknown>,

    //   group: GROUP.MAIN_CONTENT,
    // }),
    defineField({
      fieldset: "migration",
      name: "rawBody",
      type: "text",
      title: "Raw Body",
      group: GROUP.MAIN_CONTENT,
      readOnly: true,
    }),

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
