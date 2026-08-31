import { Cog } from "lucide-react";
import { defineField, defineType } from "sanity";

import { imageWithAltField } from "@/schemaTypes/common";

const socialLinks = defineField({
  name: "socialLinks",
  type: "object",
  title: "Social Media Links",
  description: "Add links to your social media profiles",
  fields: [
    defineField({
      name: "linkedin",
      type: "string",
      title: "LinkedIn URL",
      description: "Full URL to your LinkedIn profile/company page",
    }),
    defineField({
      name: "facebook",
      type: "string",
      title: "Facebook URL",
      description: "Full URL to your Facebook profile/page",
    }),
    defineField({
      name: "twitter",
      type: "string",
      title: "Twitter/X URL",
      description: "Full URL to your Twitter/X profile",
    }),
    defineField({
      name: "instagram",
      type: "string",
      title: "Instagram URL",
      description: "Full URL to your Instagram profile",
    }),
    defineField({
      name: "youtube",
      type: "string",
      title: "YouTube URL",
      description: "Full URL to your YouTube channel",
    }),
    defineField({
      name: "reddit",
      type: "string",
      title: "Reddit URL",
      description: "Full URL to your Reddit profile/subreddit",
    }),
  ],
});

export const settings = defineType({
  name: "settings",
  type: "document",
  title: "Settings",
  description: "Global settings and configuration for your website",
  icon: Cog,
  fields: [
    defineField({
      name: "label",
      type: "string",
      title: "Label",
      description: "Label used to identify settings in the CMS",
      initialValue: "Settings",
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
          title: "Logo (Light Mode)",
          description:
            "The site logo shown on light backgrounds, such as the navbar in light mode. Its alt text is reused for the other logo variants.",
        }),
        defineField({
          name: "logoDark",
          type: "image",
          title: "Logo (Dark Mode)",
          description:
            "Optional logo variant for dark backgrounds, such as the navbar in dark mode. Reuses the light logo's alt text; if left empty, the light logo is used everywhere.",
          options: { hotspot: true },
        }),
        defineField({
          name: "footerLogo",
          type: "image",
          title: "Footer Logo",
          description:
            "Optional logo for the footer's colored background, where the main logo may not have enough contrast. Reuses the main logo's alt text; if left empty, the main logo is used.",
          options: { hotspot: true },
        }),
      ],
    }),
    defineField({
      name: "favicon",
      type: "image",
      title: "Favicon",
      description:
        "The small icon shown in browser tabs and bookmarks. SVG or ICO only — use a square image, at least 48×48.",
      // `accept` only filters the picker — drag-drop and the media library
      // bypass it, so the validation below is the real enforcement. The
      // extension is the last segment of the ref (…-<width>x<height>-<ext>).
      options: { accept: "image/svg+xml,image/vnd.microsoft.icon,.ico" },
      validation: (rule) =>
        rule.custom((value) => {
          const ref = (value as { asset?: { _ref?: string } })?.asset?._ref;
          if (!ref) {
            return true;
          }
          const extension = ref.split("-").pop();
          return extension === "svg" || extension === "ico"
            ? true
            : "The favicon must be an SVG or ICO file";
        }),
    }),
    defineField({
      name: "ogImage",
      type: "image",
      title: "Default Social Share Image",
      description:
        "The fallback image shown when a page is shared on social media (Open Graph / Twitter). Used whenever a page has no SEO image of its own. Recommended size 1200×630.",
      options: { hotspot: true },
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
      media: Cog,
    }),
  },
});
