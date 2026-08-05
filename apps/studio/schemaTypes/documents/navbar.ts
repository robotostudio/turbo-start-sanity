import { LayoutPanelLeft, Link, PanelTop } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

import { lucideIconPreview } from "@/components/icon-preview";
import { buttonsField, iconField } from "@/schemaTypes/common";

const navbarLink = defineArrayMember({
  name: "navbarLink",
  type: "object",
  title: "Navigation Link",
  description: "Individual navigation link with name and URL",
  icon: Link,
  fields: [
    defineField({
      name: "name",
      type: "string",
      title: "Link Text",
      description: "The text that will be displayed for this navigation link",
    }),
    defineField({
      name: "url",
      type: "customUrl",
      title: "Link URL",
      description: "The URL that this link will navigate to when clicked",
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

const navbarColumnLink = defineArrayMember({
  name: "navbarColumnLink",
  type: "object",
  title: "Navigation Column Link",
  description: "A link within a navigation column",
  icon: LayoutPanelLeft,
  fields: [
    iconField,
    defineField({
      name: "name",
      type: "string",
      title: "Link Text",
      description: "The text that will be displayed for this navigation link",
    }),
    defineField({
      name: "description",
      type: "string",
      title: "Description",
      description: "The description for this navigation link",
    }),
    defineField({
      name: "url",
      type: "customUrl",
      title: "Link URL",
      description: "The URL that this link will navigate to when clicked",
    }),
  ],
  preview: {
    select: {
      title: "name",
      externalUrl: "url.external",
      urlType: "url.type",
      internalUrl: "url.internal.slug.current",
      openInNewTab: "url.openInNewTab",
      icon: "icon",
    },
    prepare({ title, icon, externalUrl, urlType, internalUrl, openInNewTab }) {
      const url = urlType === "external" ? externalUrl : internalUrl;
      const newTabIndicator = openInNewTab ? " ↗" : "";
      const truncatedUrl =
        url?.length > 30 ? `${url.substring(0, 30)}...` : url;

      return {
        title: title || "Untitled Link",
        subtitle: `${urlType === "external" ? "External" : "Internal"} • ${truncatedUrl}${newTabIndicator}`,
        media: lucideIconPreview(icon),
      };
    },
  },
});

const navbarColumn = defineArrayMember({
  name: "navbarColumn",
  type: "object",
  title: "Navigation Column",
  description: "A column of navigation links with an optional title",
  icon: LayoutPanelLeft,
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Column Title",
      description:
        "The heading text displayed above this group of navigation links",
    }),
    defineField({
      name: "links",
      type: "array",
      title: "Column Links",
      description: "The list of navigation links to display in this column",
      validation: (rule) => [rule.required(), rule.unique()],
      of: [navbarColumnLink],
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

export const navbar = defineType({
  name: "navbar",
  type: "document",
  title: "Site Navigation",
  description: "Configure the main navigation structure for your site",
  icon: PanelTop,
  fields: [
    defineField({
      name: "label",
      type: "string",
      title: "Navigation Label",
      description:
        "Internal label to identify this navigation configuration in the CMS",
      initialValue: "Navbar",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "columns",
      type: "array",
      title: "Navigation Structure",
      description:
        "Build your navigation menu using columns and links. Add either a column of links or individual links.",
      of: [navbarColumn, navbarLink],
    }),
    defineField({
      name: "gitHubUrl",
      type: "url",
      title: "GitHub Repository URL",
      description:
        "Public GitHub repository URL. The navbar shows this repo's live star count (e.g. https://github.com/owner/repo). Leave empty to hide the star badge.",
      validation: (rule) =>
        rule.uri({ scheme: ["https"] }).custom((value) => {
          if (!value) {
            return true;
          }
          try {
            const { hostname, pathname } = new URL(value);
            const isGitHubHost =
              hostname === "github.com" || hostname === "www.github.com";
            const segments = pathname.split("/").filter(Boolean);
            if (isGitHubHost && segments.length >= 2) {
              return true;
            }
          } catch {
            return "Please enter a valid URL";
          }
          return "Please enter a github.com repository URL";
        }),
    }),
    buttonsField,
  ],
  preview: {
    select: {
      title: "label",
    },
    prepare: ({ title }) => ({
      title: title || "Untitled Navigation",
    }),
  },
});
