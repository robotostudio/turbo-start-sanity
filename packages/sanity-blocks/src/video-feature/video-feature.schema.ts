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
      // A warning, not an error: the block renders its copy without a video.
      // It only sees whether a clip was picked — a failed encode or a
      // non-public policy lives on the asset the form cannot follow.
      validation: (Rule) =>
        Rule.required().warning("Add a video, or this block shows only text."),
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
