import {ImageIcon, LinkedinIcon, LinkIcon} from "@sanity/icons";
import {
  type ConditionalProperty,
  defineArrayMember,
  defineField,
  defineType,
  type InitialValueProperty,
} from "sanity";

import {PortableTextEditorInput} from "../../components/portable-text-editor-input";
import {schemaIcon} from "../../utils/icon-wrapper";

const limitedRichTextMembers = [
  defineArrayMember({
    name: "block",
    type: "block",
    styles: [{title: "Normal", value: "normal"}],
    marks: {
      annotations: [
        {
          name: "customLink",
          type: "object",
          title: "Internal/External Link",
          icon: LinkIcon,
          fields: [
            defineField({
              name: "customLink",
              type: "customUrl",
            }),
            defineField({
              name: 'linkVariant',
              type: 'linkVariant',
              title: 'Variant',
              initialValue: 'default',
            })
          ],
        },
      ],
      decorators: [
        {title: "Strong", value: "strong"},
        {title: "Emphasis", value: "em"},
        {title: "Underline", value: "underline"},
      ],
    },
  }),
  defineArrayMember({
    name: "inlineButton",
    type: "inlineButton",
    title: "Inline Button",
    icon: schemaIcon(LinkedinIcon),
  }),
];

export const limitedRichText = (options?: {
  initialValue?: string | undefined;
  name?: string;
  title?: string;
  group?: string[] | string;
  description?: string;
  hidden?: ConditionalProperty;
}) => {
  const {name, description, hidden, initialValue} = options ?? {};
  return defineField({
    ...options,
    name: name ?? "caption",
    type: "array",
    description:
      description ??
      "Caption text with basic formatting (bold, italic, underline, links)",
    hidden,
    of: limitedRichTextMembers,
    initialValue: (initialValue ?? "") as unknown as InitialValueProperty<
      string,
      unknown[]
    >,
  });
};

export const inlineImage = defineArrayMember({
  name: "image",
  title: "Image",
  type: "image",
  icon: ImageIcon,
  options: {
    hotspot: true,
  },
  fields: [
    limitedRichText({
      name: "caption",
      title: "Caption Text",
    }),
    defineField({
      name: "variant",
      type: "string",
      title: "Variant",
      initialValue: () => "default",
      options: {
        layout: "radio",
        list: [
          {title: "Default", value: "default"},
          {title: "Full Bleed", value: "full-bleed"},
          {title: "Fit to Container", value: "fit-to-container"},
          {title: "Inset", value: "inset"},
        ],
      },
    }),
  ],
});

const richTextMembers = [
  defineArrayMember({
    name: "block",
    type: "block",
    styles: [
      {title: "Normal", value: "normal"},
      {title: "H2", value: "h2"},
      {title: "H3", value: "h3"},
      {title: "H4", value: "h4"},
      {title: "H5", value: "h5"},
      {title: "H6", value: "h6"},
      {title: "Inline", value: "inline"},
    ],
    lists: [
      {title: "Numbered", value: "number"},
      {title: "Bullet", value: "bullet"},
    ],
    marks: {
      annotations: [
        {
          name: "customLink",
          type: "object",
          title: "Internal/External Link",
          icon: LinkIcon,
          fields: [
            defineField({
              name: "customLink",
              type: "customUrl",
            }),
          ],
        },
      ],
      decorators: [
        {title: "Strong", value: "strong"},
        {title: "Emphasis", value: "em"},
        {title: "Code", value: "code"},
      ],
    },
  }),
  inlineImage,
  // defineArrayMember({
  //   name: "imageGallery",
  //   type: "imageGallery",
  //   title: "Image Gallery",
  // }),
];

export const richText = defineType({
  name: "richText",
  type: "array",
  of: richTextMembers,
});

export const memberTypes = richTextMembers.map((member) => member.name);

type Type = NonNullable<(typeof memberTypes)[number]>;

export const customRichText = (
  type: Type[],
  options?: {
    name?: string;
    title?: string;
    group?: string[] | string;
    description?: string;
    hidden?: ConditionalProperty;
    useCustomEditor?: boolean;
  }
) => {
  const {name, description, hidden, useCustomEditor = false} = options ?? {};
  const customMembers = richTextMembers.filter(
    (member) => member.name && type.includes(member.name)
  );
  return defineField({
    ...options,
    name: name ?? "richText",
    type: "array",
    description: description ?? "",
    hidden,
    of: customMembers,
    ...(useCustomEditor && {
      components: {
        input: PortableTextEditorInput,
      },
    }),
  });
};
