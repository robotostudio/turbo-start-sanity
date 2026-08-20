import {
  definePortableTextField,
  muxVideoEmbedField,
} from "@workspace/sanity-blocks/internal/schema-fields";
import { Play } from "lucide-react";
import { defineField, defineType } from "sanity";

export const videoFeatureSchema = defineType({
  name: "videoFeature",
  type: "object",
  title: "Video",
  icon: Play,
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      title: "Eyebrow",
      description:
        "The smaller text that sits above the title to provide context",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The large text shown above the video",
    }),
    definePortableTextField(["block"], {
      name: "richText",
      description: "The supporting paragraph shown beneath the title",
    }),
    muxVideoEmbedField({
      // The block is the video: without one there is nothing to show but a
      // heading, so this blocks publishing rather than warning. The renderer
      // still copes with an absent clip — a published asset can be deleted, or
      // its encode can fail, long after the form was satisfied.
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "caption",
      type: "string",
      title: "Caption",
      description: "Optional line of text shown underneath the video",
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare: ({ title }) => ({
      title: title || "Video",
      subtitle: "Video Block",
    }),
  },
});
