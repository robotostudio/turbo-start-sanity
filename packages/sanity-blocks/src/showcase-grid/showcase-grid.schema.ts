import { ImageIcon, ImagesIcon } from "@sanity/icons";
import { imageWithAltField } from "@workspace/sanity-blocks/internal/schema-fields";
import { defineArrayMember, defineField, defineType } from "sanity";

const showcaseItem = defineArrayMember({
  name: "showcaseItem",
  type: "object",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "siteName",
      type: "string",
      title: "Site Name",
      description:
        "The name of the website or project being shown (for example: 'Volvo Chile').",
      validation: (Rule) => Rule.required().error("A site name is required"),
    }),
    defineField({
      name: "url",
      type: "url",
      title: "URL",
      description:
        "The full web address of the live site, including https://. Used to link the screenshot to the real website.",
    }),
    imageWithAltField({
      name: "screenshot",
      title: "Screenshot",
      description:
        "A screenshot of the website's homepage. This is the main image shown in the card.",
    }),
    defineField({
      name: "attributionName",
      type: "string",
      title: "Attribution Name",
      description:
        "The person, brand, or company credited for the site, shown next to the screenshot.",
    }),
    imageWithAltField({
      name: "attributionLogo",
      title: "Attribution Logo",
      description:
        "An optional small logo or mark for the credited person or brand. Leave empty to show their initials instead.",
    }),
    defineField({
      name: "builtByRoboto",
      type: "boolean",
      title: "Built by Roboto",
      description:
        "Turn this on to show a 'Built by Roboto' badge on the card, indicating we built this site.",
      initialValue: false,
    }),
    defineField({
      name: "featured",
      type: "boolean",
      title: "Featured",
      description:
        "Turn this on to show this site in the large featured card at the top of the section. If more than one is marked, only the first is used.",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "siteName",
      subtitle: "attributionName",
      media: "screenshot",
    },
    prepare: ({ title, subtitle, media }) => ({
      title: title || "Untitled site",
      subtitle: subtitle || "Showcase item",
      media,
    }),
  },
});

export const showcaseGridSchema = defineType({
  name: "showcaseGrid",
  type: "object",
  icon: ImagesIcon,
  title: "Showcase Grid",
  description:
    "A section that shows off real websites built with the template. Add the sites as items below — the one marked 'Featured' is shown in the large card at the top.",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      description:
        'Optional short label shown in a pill above the title, for example "Showcase"',
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description:
        "The large heading shown at the top of the section (for example: 'Real sites. Real traffic. Same starting point as yours.')",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      description:
        "The short paragraph shown under the title that explains what the showcase is about.",
    }),
    defineField({
      name: "items",
      title: "Showcase Items",
      type: "array",
      description:
        "The websites to show in the grid. Drag to reorder — the order here is the order visitors see. Mark one item as 'Featured' to show it in the large card at the top.",
      of: [showcaseItem],
    }),
  ],
  preview: {
    select: {
      title: "title",
      items: "items",
    },
    prepare: ({ title, items = [] }) => {
      const count = items.length;
      const label = count === 1 ? "site" : "sites";
      return {
        title: title || "Showcase Grid",
        subtitle: `${count} ${label}`,
      };
    },
  },
});
