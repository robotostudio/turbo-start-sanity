import { Video } from "lucide-react";
import { defineField, defineType } from "sanity";

import { createRadioListLayout } from "../../utils/helper";
import { iconWrapper } from '../../utils/icon-wrapper';

export const videoSection = defineType({
  name: "videoSection",
  title: "Video Section",
  type: "object",
  icon: iconWrapper(Video),
  fields: [
    defineField({
      name: "video",
      title: "Video",
      type: "mux.video",
      description: "The Mux video to display in this section",
    }),
    defineField({
      name: "styleVariant",
      title: "Style Variant",
      type: "string",
      description:
        "Choose how the video should be displayed - full bleed extends to the edges, fit to container maintains aspect ratio within the container",
      initialValue: () => "fitToContainer",
      options: createRadioListLayout(["fullBleed", "fitToContainer"]),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Optional title displayed above the video",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      description: "Optional description displayed below the video",
    }),
  ],
  preview: {
    select: {
      title: "title",
      styleVariant: "styleVariant",
      video: "video",
    },
    prepare: ({ title, styleVariant, video }) => ({
      title: title || "Video Section",
      subtitle: styleVariant === "fullBleed" ? "Full Bleed" : "Fit to Container",
      media: video?.asset?.thumbnailUrl || undefined,
    }),
  },
});

