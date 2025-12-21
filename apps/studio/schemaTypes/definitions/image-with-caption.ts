import { ImageIcon } from "@sanity/icons";
import type { Component } from "react";
import { defineField, type PreviewComponent } from "sanity";

import { ImagesArrayFieldIemPreview } from "@/plugins/ImagesArrayFieldItemPreview";
import { iconWrapper } from "../../utils/icon-wrapper";
import { limitedRichText } from "./rich-text";

export const imageWithCaption = defineField({
  name: "image",
  title: "Image with Caption",
  type: "image",
  icon: iconWrapper(ImageIcon),
  options: {
    hotspot: true,
  },
  components: {
    preview: ImagesArrayFieldIemPreview as unknown as any,
    // item: ImagesArrayFieldIemPreview as unknown as PreviewComponent,
  },
  fields: [
    limitedRichText({
      name: "caption",
      title: "Caption",
      initialValue: "",
    }),
  ],
});
