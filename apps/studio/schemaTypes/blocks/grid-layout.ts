import { LayoutGridIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

import { createRadioListLayout } from "../../utils/helper";
import { iconWrapper } from "../../utils/icon-wrapper";

export const gridLayout = defineType({
  name: "gridLayout",
  title: "Grid Layout",
  type: "object",
  icon: iconWrapper(LayoutGridIcon),
  fields: [
    defineField({
      name: "pageBuilder",
      title: "Sections",
      type: "pageBuilder",
      description:
        "Add sections that will be displayed in a grid layout. Each section will appear in its own column.",
    }),
    defineField({
      name: "columnVariant",
      title: "Variant",
      type: "string",
      initialValue: () => "auto",
      options: createRadioListLayout(["auto", "single", "two", "three"]),
      description:
        "Choose how many columns the grid should flow across. If not set, the number of columns will match the number of sections.",
    }),
  ],
  preview: {
    select: {
      sections: "pageBuilder",
      columnVariant: "columnVariant",
    },
    prepare: ({ sections = [], columnVariant }) => {
      const sectionCount = sections.length || 0;
      let columns = 1;
      if (columnVariant === "auto") {
        columns = sectionCount;
      } else if (columnVariant === "single") {
        columns = 1;
      } else if (columnVariant === "two") {
        columns = 2;
      } else if (columnVariant === "three") {
        columns = 3;
      }
      return {
        title: "Grid Layout",
        subtitle: `${sectionCount} section${sectionCount === 1 ? "" : "s"} • ${columns} column${columns === 1 ? "" : "s"}`,
      };
    },
  },
});
