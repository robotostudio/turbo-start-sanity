import { Images } from "lucide-react";
import {
  defineArrayMember,
  defineField,
  type ImageRule,
  type ImageValue,
  type ObjectRule,
  type Rule,
  type ValidationBuilder,
} from "sanity";

export { definePortableTextField } from "./sanity-rich-text";

export const buttonsField = defineField({
  name: "buttons",
  type: "array",
  description:
    "Add one or more clickable buttons that visitors can use to navigate your website",
  of: [defineArrayMember({ type: "button" })],
});

export const iconField = defineField({
  name: "icon",
  type: "lucide-icon",
  title: "Icon",
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
    icon: Images,
    fields: [
      imageWithAltField({
        title: "Logo",
        description:
          "The partner or brand logo to display. Use a transparent PNG or SVG for the cleanest result",
      }),
      defineField({
        name: "url",
        type: "customUrl",
        title: "Link URL",
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

/**
 * A Mux video plus its playback choices: the shape `MuxVideo` renders, for a
 * clip a visitor chooses to watch. Background video takes the bare
 * `muxVideoField` — always muted, always looping, nothing to ask.
 */
export const muxVideoEmbedField = ({
  description = "The video for this section, and how it plays.",
  group,
  name = "video",
  title = "Video",
  validation,
}: {
  description?: string;
  group?: string;
  name?: string;
  title?: string;
  validation?: ValidationBuilder<ObjectRule, Record<string, unknown>>;
} = {}) =>
  defineField({
    name,
    type: "object",
    title,
    description,
    group,
    validation,
    options: { collapsible: false },
    fields: [
      muxVideoField({
        name: "asset",
        title: "File",
        validation: (Rule) => Rule.required(),
      }),
      defineField({
        name: "autoPlay",
        type: "boolean",
        title: "Play automatically",
        description:
          "Starts the video without sound as soon as the page loads. Leave it off and visitors see the opening frame with a play button.",
        initialValue: false,
      }),
      defineField({
        name: "loop",
        type: "boolean",
        title: "Repeat",
        description: "Starts again from the beginning when it reaches the end.",
        initialValue: false,
      }),
    ],
  });

/** A bare Mux clip. The plugin encodes it for every device on upload. */
export const muxVideoField = ({
  description = "Upload a file, paste a video URL, or pick one already in the project.",
  group,
  name = "video",
  title = "Video",
  validation,
}: {
  description?: string;
  group?: string;
  name?: string;
  title?: string;
  validation?: ValidationBuilder<Rule>;
} = {}) =>
  defineField({
    name,
    type: "mux.video",
    title,
    description,
    group,
    validation,
    options: { collapsible: false },
  });
