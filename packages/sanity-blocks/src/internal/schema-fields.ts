import { ImagesIcon } from "@sanity/icons";
import {
  defineArrayMember,
  defineField,
  type ImageRule,
  type ImageValue,
  type ValidationBuilder,
} from "sanity";

export { definePortableTextField } from "./sanity-rich-text";

export const buttonsField = defineField({
  name: "buttons",
  type: "array",
  of: [{ type: "button" }],
  description:
    "Add one or more clickable buttons that visitors can use to navigate your website",
});

export const iconField = defineField({
  name: "icon",
  title: "Icon",
  type: "lucide-icon",
  description:
    "Choose a small picture symbol to represent this item, like a home icon or shopping cart",
});

type Props = {
  description?: string;
  group?: string;
  name?: string;
  title?: string;
  validation?: ValidationBuilder<ImageRule, ImageValue>;
};

export const imageWithAltField = ({
  description = "An image, make sure to add an alt text and use the hotspot tool to ensure if image is cropped it highlights the focus point",
  group,
  name = "image",
  title = "Image",
  validation,
}: Props = {}) =>
  defineField({
    name,
    type: "image",
    title,
    description,
    group,
    validation,
    options: {
      hotspot: true,
    },
    fields: [
      defineField({
        name: "alt",
        type: "string",
        title: "Alt Text",
        description:
          "The text that describes the image for screen readers and search engines",
        validation: (Rule) =>
          Rule.custom((value, context) => {
            const parent = context.parent as { asset?: unknown };
            return parent?.asset && !value?.trim()
              ? "Alt text is required when an image is set"
              : true;
          }),
      }),
    ],
  });

/**
 * A logo-with-optional-link array member, shared by the CTA "used by teams"
 * strip and the Logo Cloud block. Only the member `name` differs.
 */
export const logoLinkItem = (name: string) =>
  defineArrayMember({
    name,
    type: "object",
    icon: ImagesIcon,
    fields: [
      imageWithAltField({
        title: "Logo",
        description:
          "The partner or brand logo to display. Use a transparent PNG or SVG for the cleanest result",
      }),
      defineField({
        name: "url",
        title: "Link URL",
        type: "customUrl",
        description:
          "Optional link opened when a visitor clicks this logo, for example the brand's website",
      }),
    ],
    preview: {
      select: {
        media: "image",
        alt: "image.alt",
        externalUrl: "url.external",
        internalUrl: "url.internal.slug.current",
        urlType: "url.type",
      },
      prepare: ({ media, alt, externalUrl, internalUrl, urlType }) => {
        const url = urlType === "external" ? externalUrl : internalUrl;

        return {
          title: alt || "Logo",
          subtitle: url || "No link",
          media,
        };
      },
    },
  });
