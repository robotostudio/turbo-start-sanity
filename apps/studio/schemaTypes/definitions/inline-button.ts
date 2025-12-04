import { defineField, defineType} from "sanity";

export default defineType({
  name: "inlineButton",
  title: "Inline Button",
  type: "object",
  fields: [
    defineField({
      name: "link",
      title: "Link",
      type: "customUrl",
    }),
    defineField({
      name: "text",
      title: "Override Button Text (optional)",
      type: "string",
      description:
        "The text that appears on the button, like 'Learn More' or 'Get Started'",
    })
  ],
  preview: {
    select: {
      urlType: "link.type",
      externalUrl: "link.external",
      internalUrl: "link.internal.slug.current",
      openInNewTab: "link.openInNewTab",
    },
    prepare: ({urlType, externalUrl, internalUrl, openInNewTab}) => {
      const url = urlType === "external" ? externalUrl : internalUrl;
      const newTabIndicator = openInNewTab ? " ↗" : "";

      return {
        title: `Inline Button • ${url}${newTabIndicator}`,
      };
    },
  },
});
