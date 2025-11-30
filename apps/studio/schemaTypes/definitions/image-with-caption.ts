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
      title: "Caption Text",
      initialValue: "",
    }),
    defineField({
      name: "variant",
      type: "string",
      title: "Variant",
      initialValue: "fit-to-container",
      options: {
        layout: "radio",
        list: [
          {title: "Default", value: "fit-to-container"},
          {title: "Full Bleed", value: "full-bleed"},
          {title: "Inset", value: "inset"},
        ],
      },
    }),
  ],
});
