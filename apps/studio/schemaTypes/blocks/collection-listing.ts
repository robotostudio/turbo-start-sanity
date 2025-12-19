import { FolderIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

import { createRadioListLayout } from "../../utils/helper";
import { iconWrapper } from "../../utils/icon-wrapper";

export const collectionListing = defineType({
  name: "collectionListing",
  title: "Collection Listing",
  type: "object",
  icon: iconWrapper(FolderIcon),
  description:
    "Display a grid of collection documents ordered by their rank. Collections will be automatically fetched and displayed in a responsive grid layout.",
  fields: [
    defineField({
      name: "columnVariant",
      title: "Grid Columns",
      type: "string",
      description:
        "Choose how many columns the collection grid should display. Collections will automatically wrap to new rows.",
      initialValue: () => "auto",
      options: createRadioListLayout(["auto", "two", "three", "four"]),
    }),
  ],
  preview: {
    select: {
      columnVariant: "columnVariant",
    },
    prepare: ({ columnVariant }) => {
      let columnText: string;
      switch (columnVariant) {
        case "auto":
          columnText = "Auto Columns";
          break;
        case "two":
          columnText = "Two Columns";
          break;
        case "three":
          columnText = "Three Columns";
          break;
        case "four":
          columnText = "Four Columns";
          break;
        default:
          columnText = "Auto Columns";
      }
      return {
        title: "Collection Listing",
        subtitle: columnText,
      };
    },
  },
});
