import {
  defineField,
  type ImageRule,
  type ImageValue,
  type PreviewConfig,
  type SlugOptions,
  type ValidationBuilder,
} from "sanity";

import { PathnameFieldComponent } from "@/components/slug-field-component";
import { GROUP } from "@/utils/constant";
import {
  createSlugValidator,
  getDocumentTypeConfig,
} from "@/utils/slug-validation";

export const richTextField = defineField({
  name: "richText",
  type: "richText",
  description:
    "A text editor that lets you add formatting like bold text, links, and bullet points",
});

export const buttonsField = defineField({
  name: "buttons",
  type: "array",
  of: [{ type: "button" }],
  description:
    "Add one or more clickable buttons that visitors can use to navigate your website",
});

export const pageBuilderField = defineField({
  name: "pageBuilder",
  group: GROUP.MAIN_CONTENT,
  type: "pageBuilder",
  description:
    "Build your page by adding different sections like text, images, and other content blocks",
});

export const iconField = defineField({
  name: "icon",
  title: "Icon",
  options: {
    // storeSvg: true,
    // providers: ["fi"],
  },
  // type: "iconPicker",
  type: "lucide-icon",
  description:
    "Choose a small picture symbol to represent this item, like a home icon or shopping cart",
});

export const documentSlugField = (
  documentType: string,
  options: {
    group?: string;
    description?: string;
    title?: string;
    prefix?: string;
  } = {}
) => {
  const {
    group,
    description = `The web address where people can find your ${documentType} (automatically created from title)`,
    title = "URL",
    prefix,
  } = options;

  return defineField({
    name: "slug",
    type: "slug",
    title,
    description,
    group,
    options: {
      prefix,
    } as SlugOptions,
    components: {
      field: PathnameFieldComponent,
    },
    validation: (Rule) => [
      Rule.required().error("A URL slug is required"),
      Rule.custom(createSlugValidator(getDocumentTypeConfig(documentType))),
    ],
  });
};

export const imageWithAltField = ({
  name = "image",
  title = "Image",
  description = "An image, make sure to add an alt text and use the hotspot tool to ensure if image is cropped it highlights the focus point",
  validation,
  group,
}: {
  name?: string;
  title?: string;
  description?: string;
  group?: string;
  validation?: ValidationBuilder<ImageRule, ImageValue>;
} = {}) =>
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
      }),
    ],
  });


export const createDocumentPreview = (options?: {
  defaultTitle?: string;
  privateStatusEmoji?: string;
  publicStatusEmoji?: string;
  builderEmojiWithCount?: (count: number) => string;
  builderEmojiEmpty?: string;
}) => {
  const {
    defaultTitle = "...",
    privateStatusEmoji = "[Private]",
    publicStatusEmoji = "",
    builderEmojiWithCount = (count: number) => `(${count})`,
    builderEmojiEmpty = "...",
  } = options || {};

  return {
    select: {
      title: "title",
      slug: "slug.current",
      media: "image",
      isPrivate: "seoNoIndex",
      hasPageBuilder: "pageBuilder",
    },
    prepare: ({
      title,
      slug,
      media,
      isPrivate,
      hasPageBuilder,
    }: {
      title?: string;
      slug?: string;
      media?: unknown;
      isPrivate?: boolean;
      hasPageBuilder?: unknown[];
    }) => {
      const statusEmoji = isPrivate ? privateStatusEmoji : publicStatusEmoji;
      const builderEmoji = hasPageBuilder?.length
        ? builderEmojiWithCount(hasPageBuilder.length)
        : builderEmojiEmpty;

      return {
        title: `${title || defaultTitle}`,
        subtitle: `${statusEmoji} ${builderEmoji} | 🔗 ${slug || "no-slug"}`,
        media,
      } as {
        title: string;
        subtitle: string;
        media: unknown;
      };
    },
  } as PreviewConfig;
};
