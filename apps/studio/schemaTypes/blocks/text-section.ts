import { DocumentIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

import { createRadioListLayout } from "../../utils/helper";
import { richTextField } from "../common";
import { richText } from "../definitions/rich-text";

export const textSection = defineType({
  name: "textSection",
  title: "Text Section",
  type: "object",
  icon: DocumentIcon,
  fields: [
    // richTextField,
    richTextField,
    defineField({
      name: "columnVariant",
      title: "Column Layout",
      type: "string",
      description:
        "Choose how many columns the text should flow across. Text will automatically wrap across columns.",
      initialValue: () => "single",
      options: createRadioListLayout(["single", "two", "three"]),
    }),
  ],
  preview: {
    select: {
      columnVariant: "columnVariant",
      richText: "richText",
    },
    prepare: ({ columnVariant, richText }) => {
      let columnText: string;
      switch (columnVariant) {
        case "single":
          columnText = "Single Column";
          break;
        case "two":
          columnText = "Two Columns";
          break;
        case "three":
          columnText = "Three Columns";
          break;
        default:
          columnText = "Auto Columns";
      }
      const hasContent = Array.isArray(richText) && richText.length > 0;
      return {
        title: hasContent ? "Text Section" : "Text Section (Empty)",
        subtitle: columnText,
      };
    },
  },
});
