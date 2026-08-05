import { LinkIcon, UsersIcon } from "@sanity/icons";
import { imageWithAltField } from "@workspace/sanity-blocks/internal/schema-fields";
import { defineArrayMember, defineField, defineType } from "sanity";

const SOCIAL_PLATFORMS = [
  { title: "Reddit", value: "reddit" },
  { title: "X (Twitter)", value: "x" },
  { title: "YouTube", value: "youtube" },
  { title: "GitHub", value: "github" },
  { title: "LinkedIn", value: "linkedin" },
  { title: "Facebook", value: "facebook" },
  { title: "Instagram", value: "instagram" },
  { title: "Slack", value: "slack" },
] as const;

const socialGridItem = defineArrayMember({
  name: "socialGridItem",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "platform",
      type: "string",
      title: "Platform",
      description:
        "Choose which social platform this card links to. It decides the logo shown in the centre of the card",
      options: {
        list: [...SOCIAL_PLATFORMS],
        layout: "dropdown",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "label",
      type: "string",
      title: "Label",
      description:
        'The name shown at the bottom of the card, for example "Reddit" or "X [Twitter]"',
      validation: (Rule) => Rule.required(),
    }),
    imageWithAltField({
      name: "logo",
      title: "Logo",
      description:
        "Optional custom logo image for this card. When set, it replaces the built-in platform icon in the centre of the card.",
    }),
    defineField({
      name: "url",
      type: "customUrl",
      title: "Link URL",
      description:
        "Where visitors go when they click this card, for example your community's profile page",
    }),
  ],
  preview: {
    select: {
      label: "label",
      platform: "platform",
    },
    prepare: ({ label, platform }) => ({
      title: label || platform || "Social card",
      subtitle: platform,
    }),
  },
});

export const socialGridSchema = defineType({
  name: "socialGrid",
  type: "object",
  title: "Social Grid",
  description:
    "A community section with a heading and a row of large cards linking to your social platforms",
  icon: UsersIcon,
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      title: "Eyebrow",
      description:
        'Short label shown in a pill above the title, for example "Socials"',
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description:
        'The main heading for this section, for example "Join our community"',
    }),
    defineField({
      name: "subtitle",
      type: "text",
      title: "Subtitle",
      description:
        "A short supporting sentence shown beneath the title to add context",
      rows: 2,
    }),
    defineField({
      name: "socials",
      type: "array",
      title: "Social Cards",
      description: "Add the social platform cards to display in the row",
      of: [socialGridItem],
    }),
  ],
  preview: {
    select: {
      title: "title",
      socials: "socials",
    },
    prepare: ({ title, socials = [] }) => {
      const count = socials.length;
      const label = count === 1 ? "card" : "cards";
      return {
        title: title || "Social Grid",
        subtitle: `${count} ${label}`,
      };
    },
  },
});
