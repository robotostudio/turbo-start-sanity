import { ImagesIcon } from "@sanity/icons";
import { logoLinkItem } from "@workspace/sanity-blocks/internal/schema-fields";
import { defineField, defineType } from "sanity";

const logoCloudItem = logoLinkItem("logoCloudItem");

export const logoCloudSchema = defineType({
  name: "logoCloud",
  type: "object",
  icon: ImagesIcon,
  title: "Logo Cloud",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description:
        'Optional short label displayed above the logos, for example "Used by teams"',
    }),
    defineField({
      name: "logos",
      title: "Logos",
      type: "array",
      description: "Add the partner or brand logos to display in the row",
      of: [logoCloudItem],
    }),
  ],
  preview: {
    select: {
      logos: "logos",
      title: "title",
    },
    prepare: ({ logos = [], title }) => {
      const logoCount = logos.length;
      const logoLabel = logoCount === 1 ? "logo" : "logos";

      return {
        title: title || "Logo Cloud",
        subtitle: `${logoCount} ${logoLabel}`,
      };
    },
  },
});
