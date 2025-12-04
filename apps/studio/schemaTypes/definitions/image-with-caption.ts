import {ImageIcon} from "@sanity/icons";
import {defineField} from "sanity";

import {schemaIcon} from "../../utils/icon-wrapper";
import {limitedRichText} from "./rich-text";

export const imageWithCaption = defineField({
  name: "image",
  title: "Image with Caption",
  type: "image",
  icon: schemaIcon(ImageIcon),
  options: {
    hotspot: true,
  },
  fields: [
    limitedRichText({
      name: "caption",
      title: "Caption",
      initialValue: "",
    }),
  ],
});
