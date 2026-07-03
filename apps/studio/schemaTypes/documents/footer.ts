import { BadgeCheck, LayoutPanelLeft, Link, PanelBottom } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const footerCreditItem = defineArrayMember({
  name: "footerCredit",
  type: "object",
  icon: BadgeCheck,
  fields: [
    defineField({
      name: "label",
      type: "string",
      title: "Label",
      description: "Text before the logo, e.g. 'Powered by' or 'Hosted on'",
    }),
    defineField({
      name: "logo",
      type: "image",
      title: "Logo",
      description: "Brand logo shown after the label",
      options: { hotspot: true },
    }),
    defineField({
      name: "url",
      type: "url",
      title: "Link",
      description: "Optional link the credit points to (opens in a new tab)",
    }),
  ],
  preview: {
    select: { title: "label", media: "logo" },
    prepare: ({ title, media }) => ({ title: title || "Credit", media }),
  },
});

const footerColumnLink = defineField({
  name: "footerColumnLink",
  type: "object",
  icon: Link,
  fields: [
    defineField({
      name: "name",
      type: "string",
      title: "Name",
      description: "Name for the link",
    }),
    defineField({
      name: "url",
      type: "customUrl",
    }),
  ],
  preview: {
    select: {
      title: "name",
      externalUrl: "url.external",
      urlType: "url.type",
      internalUrl: "url.internal.slug.current",
      openInNewTab: "url.openInNewTab",
    },
    prepare({ title, externalUrl, urlType, internalUrl, openInNewTab }) {
      const url = urlType === "external" ? externalUrl : internalUrl;
      const newTabIndicator = openInNewTab ? " ↗" : "";
      const truncatedUrl =
        url?.length > 30 ? `${url.substring(0, 30)}...` : url;

      return {
        title: title || "Untitled Link",
        subtitle: `${urlType === "external" ? "External" : "Internal"} • ${truncatedUrl}${newTabIndicator}`,
        media: Link,
      };
    },
  },
});

const footerColumn = defineField({
  name: "footerColumn",
  type: "object",
  icon: LayoutPanelLeft,
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "Title for the column",
    }),
    defineField({
      name: "links",
      type: "array",
      title: "Links",
      description: "Links for the column",
      of: [footerColumnLink],
    }),
  ],
  preview: {
    select: {
      title: "title",
      links: "links",
    },
    prepare({ title, links = [] }) {
      return {
        title: title || "Untitled Column",
        subtitle: `${links.length} link${links.length === 1 ? "" : "s"}`,
      };
    },
  },
});

export const footer = defineType({
  name: "footer",
  type: "document",
  title: "Footer",
  description: "Footer content for your website",
  fields: [
    defineField({
      name: "label",
      type: "string",
      initialValue: "Footer",
      title: "Label",
      description: "Label used to identify footer in the CMS",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "subtitle",
      type: "text",
      rows: 2,
      title: "Subtitle",
      description: "Subtitle that sits beneath the logo in the footer",
    }),
    defineField({
      name: "columns",
      type: "array",
      title: "Columns",
      description: "Columns for the footer",
      of: [footerColumn],
    }),
    defineField({
      name: "poweredBy",
      type: "string",
      title: "Powered by text",
      description:
        "Credit shown on the left of the bottom bar, e.g. 'Powered by Vercel & Sanity'",
      initialValue: "Powered by Vercel & Sanity",
    }),
    defineField({
      name: "credit",
      type: "string",
      title: "Studio credit",
      description: "Highlighted credit shown in the center of the bottom bar",
      initialValue: "Roboto Studio",
    }),
    defineField({
      name: "creditUrl",
      type: "url",
      title: "Studio credit link",
      description: "Optional link for the center credit (opens in a new tab)",
    }),
    defineField({
      name: "copyright",
      type: "string",
      title: "Copyright text",
      description: "Copyright line shown on the right of the bottom bar",
      initialValue: "© 2025 Turbo Start",
    }),
    defineField({
      name: "watermark",
      type: "image",
      title: "Watermark image",
      description:
        "Optional faded graphic shown above the center credit (defaults to the Turbo mark)",
      options: { hotspot: true },
    }),
    defineField({
      name: "credits",
      type: "array",
      title: "Footer credits",
      description:
        "Credits shown on the right of the footer bar — each has a label and a logo (e.g. 'Powered by Sanity', 'Hosted on Vercel')",
      of: [footerCreditItem],
    }),
  ],
  preview: {
    select: {
      title: "label",
    },
    prepare: ({ title }) => ({
      title: title || "Untitled Footer",
      media: PanelBottom,
    }),
  },
});
