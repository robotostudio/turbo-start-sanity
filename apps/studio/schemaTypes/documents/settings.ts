import { CogIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

import { imageWithAltField } from "@/schemaTypes/common";

const socialLinks = defineField({
  name: "socialLinks",
  title: "Social Media Links",
  description: "Add links to your social media profiles",
  type: "object",
  fields: [
    defineField({
      name: "linkedin",
      title: "LinkedIn URL",
      description: "Full URL to your LinkedIn profile/company page",
      type: "string",
    }),
    defineField({
      name: "facebook",
      title: "Facebook URL",
      description: "Full URL to your Facebook profile/page",
      type: "string",
    }),
    defineField({
      name: "twitter",
      title: "Twitter/X URL",
      description: "Full URL to your Twitter/X profile",
      type: "string",
    }),
    defineField({
      name: "instagram",
      title: "Instagram URL",
      description: "Full URL to your Instagram profile",
      type: "string",
    }),
    defineField({
      name: "youtube",
      title: "YouTube URL",
      description: "Full URL to your YouTube channel",
      type: "string",
    }),
    defineField({
      name: "reddit",
      title: "Reddit URL",
      description: "Full URL to your Reddit profile/subreddit",
      type: "string",
    }),
  ],
});

export const settings = defineType({
  name: "settings",
  type: "document",
  title: "Settings",
  description: "Global settings and configuration for your website",
  icon: CogIcon,
  fields: [
    defineField({
      name: "label",
      type: "string",
      initialValue: "Settings",
      title: "Label",
      description: "Label used to identify settings in the CMS",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "siteTitle",
      type: "string",
      title: "Site Title",
      description:
        "The main title of your website, used in browser tabs and SEO",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "siteDescription",
      type: "text",
      title: "Site Description",
      description: "A brief description of your website for SEO purposes",
      validation: (rule) => rule.required().min(50).max(160),
    }),
    defineField({
      name: "logos",
      type: "object",
      title: "Logos",
      description: "The logo variants used across the site",
      options: { collapsible: true, collapsed: false },
      fields: [
        imageWithAltField({
          name: "logo",
          title: "Logo (light mode)",
          description:
            "The site logo shown on light backgrounds, such as the navbar in light mode. Its alt text is reused for the other logo variants.",
        }),
        defineField({
          name: "logoDark",
          type: "image",
          title: "Logo (dark mode)",
          description:
            "Optional logo variant for dark backgrounds, such as the navbar in dark mode. Reuses the light logo's alt text; if left empty, the light logo is used everywhere.",
          options: { hotspot: true },
        }),
        defineField({
          name: "footerLogo",
          type: "image",
          title: "Footer logo",
          description:
            "Optional logo for the footer's colored background, where the main logo may not have enough contrast. Reuses the main logo's alt text; if left empty, the main logo is used.",
          options: { hotspot: true },
        }),
      ],
    }),
    defineField({
      name: "contactEmail",
      type: "string",
      title: "Contact Email",
      description: "Primary contact email address for your website",
      validation: (rule) => rule.email(),
    }),
    socialLinks,
  ],
  preview: {
    select: {
      title: "label",
    },
    prepare: ({ title }) => ({
      title: title || "Untitled Settings",
      media: CogIcon,
    }),
  },
});
