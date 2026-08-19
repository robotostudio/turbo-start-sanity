import { Image, Images } from "lucide-react";
import { imageWithAltField } from "@workspace/sanity-blocks/internal/schema-fields";
import { defineArrayMember, defineField, defineType } from "sanity";

const showcaseItem = defineArrayMember({
  name: "showcaseItem",
  type: "object",
  icon: Image,
  fields: [
    defineField({
      name: "siteName",
      type: "string",
      title: "Site Name",
      description:
        "The name of the site, shown as the label beneath its screenshot (for example: 'Acme Store').",
      validation: (Rule) => Rule.required().error("A site name is required"),
    }),
    defineField({
      name: "url",
      type: "url",
      title: "URL",
      description:
        "The live site's full web address, including https://. When set, the whole card links out to it (opens in a new tab). Leave empty for a display-only card.",
    }),
    defineField({
      name: "category",
      type: "string",
      title: "Category",
      description:
        "A short label shown on the right of the card (for example: 'Real Estate', 'Portfolio', 'Intelligence Software').",
    }),
    imageWithAltField({
      name: "screenshot",
      title: "Screenshot",
      description:
        "A screenshot of the site's homepage — the main image on the card. Use a 16:9 image for the cleanest crop.",
    }),
    imageWithAltField({
      name: "attributionLogo",
      title: "Logo",
      description:
        "Optional small logo or mark for the site, shown next to its name. Leave empty to fall back to the site's initials.",
    }),
    defineField({
      name: "featured",
      type: "boolean",
      title: "Featured",
      description:
        "Show this site as a large banner at the top of the section. Each site marked here becomes its own banner.",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "siteName",
      subtitle: "url",
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
  title: "Showcase Grid",
  description:
    "A section that shows off real websites built with the template. Add the sites as items below — the one marked 'Featured' is shown in the large card at the top.",
  icon: Images,
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description:
        "The large heading at the top of the section (for example: 'Sites built with this starter').",
    }),
    defineField({
      name: "description",
      type: "text",
      title: "Description",
      description:
        "The short paragraph under the title that sets up what the showcase is about.",
      rows: 3,
    }),
    defineField({
      name: "items",
      type: "array",
      title: "Showcase Items",
      description:
        "The sites shown in the grid. Drag to reorder — visitors see them in this order. Mark one as Featured to give it the large banner; if you don't mark any, the first item gets the banner automatically. Add a URL to make a card link out to its live site.",
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
