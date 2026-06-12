import {
  buttonsField,
  definePortableTextField,
  imageWithAltField,
} from "@workspace/sanity-blocks/internal/schema-fields";
import { ImageIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

const imageLinkCardItem = defineField({
  name: "imageLinkCard",
  type: "object",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "title",
      title: "Card Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Card Description",
      type: "text",
      validation: (Rule) => Rule.required(),
    }),
    imageWithAltField({
      title: "Card Image",
      description: "Add an image or illustration for this card",
    }),
    defineField({
      name: "url",
      title: "Link URL",
      type: "customUrl",
    }),
  ],
  preview: {
    select: {
      description: "description",
      externalUrl: "url.external",
      internalUrl: "url.internal.slug.current",
      media: "image",
      openInNewTab: "url.openInNewTab",
      title: "title",
      urlType: "url.type",
    },
    prepare: ({
      description,
      externalUrl,
      internalUrl,
      media,
      openInNewTab,
      title,
      urlType,
    }) => {
      const url = urlType === "external" ? externalUrl : internalUrl;
      const newTabIndicator = openInNewTab ? " ↗" : "";

      return {
        title: title || "Untitled Card",
        subtitle: description + (url ? ` • ${url}${newTabIndicator}` : ""),
        media,
      };
    },
  },
});

export const imageLinkCardsSchema = defineType({
  name: "imageLinkCards",
  type: "object",
  icon: ImageIcon,
  title: "Image Link Cards",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow Text",
      type: "string",
      description: "Optional text displayed above the title",
    }),
    defineField({
      name: "title",
      title: "Section Title",
      type: "string",
      description: "The main heading for this cards section",
      validation: (Rule) => Rule.required(),
    }),
    definePortableTextField(["block"], {
      name: "richText",
    }),
    buttonsField,
    defineField({
      name: "cards",
      title: "Cards",
      type: "array",
      of: [imageLinkCardItem],
    }),
  ],
  preview: {
    select: {
      cards: "cards",
      eyebrow: "eyebrow",
      title: "title",
    },
    prepare: ({ cards = [], eyebrow, title }) => {
      const eyebrowPrefix = eyebrow ? `${eyebrow} • ` : "";
      const cardCount = cards.length;
      const cardLabel = cardCount === 1 ? "card" : "cards";

      return {
        title: title || "Image Link Cards",
        subtitle: `${eyebrowPrefix}${cardCount} ${cardLabel}`,
      };
    },
  },
});
