import { CodeBlockIcon, ImageIcon, LinkIcon } from "@sanity/icons";
import {
  type ConditionalProperty,
  defineArrayMember,
  defineField,
  defineType,
} from "sanity";

const CODE_LANGUAGES = [
  { title: "TypeScript", value: "ts" },
  { title: "TSX", value: "tsx" },
  { title: "JavaScript", value: "js" },
  { title: "GROQ", value: "groq" },
  { title: "Bash", value: "bash" },
  { title: "JSON", value: "json" },
  { title: "CSS", value: "css" },
];

const richTextMembers = [
  defineArrayMember({
    name: "block",
    type: "block",
    styles: [
      { title: "Normal", value: "normal" },
      { title: "H2", value: "h2" },
      { title: "H3", value: "h3" },
      { title: "H4", value: "h4" },
      { title: "H5", value: "h5" },
      { title: "H6", value: "h6" },
      { title: "Inline", value: "inline" },
    ],
    lists: [
      { title: "Numbered", value: "number" },
      { title: "Bullet", value: "bullet" },
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
        { title: "Strong", value: "strong" },
        { title: "Emphasis", value: "em" },
        { title: "Code", value: "code" },
      ],
    },
  }),
  defineArrayMember({
    name: "image",
    title: "Image",
    type: "image",
    icon: ImageIcon,
    options: {
      hotspot: true,
    },
    fields: [
      defineField({
        name: "alt",
        type: "string",
        title: "Alternative text",
        description: "Describe the image for screen readers and search engines",
      }),
      defineField({
        name: "caption",
        type: "string",
        title: "Caption Text",
        description: "Optional caption shown beneath the image.",
      }),
    ],
  }),
  defineArrayMember({
    name: "code",
    title: "Code Block",
    type: "object",
    icon: CodeBlockIcon,
    description:
      "A multi-line code snippet with preserved indentation. Use this for code examples instead of the inline Code style.",
    fields: [
      defineField({
        name: "code",
        title: "Code",
        type: "text",
        rows: 8,
        description: "The code snippet. Indentation and line breaks are kept.",
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: "language",
        title: "Language",
        type: "string",
        description: "Optional language label shown in the code block header.",
        options: {
          list: CODE_LANGUAGES,
        },
      }),
      defineField({
        name: "filename",
        title: "Filename",
        type: "string",
        description: "Optional filename shown in the code block header.",
      }),
    ],
    preview: {
      select: {
        filename: "filename",
        language: "language",
        code: "code",
      },
      prepare({ filename, language, code }) {
        const firstLine = (code ?? "").split("\n")[0]?.trim();
        return {
          title: filename || firstLine || "Code Block",
          subtitle: language ?? "Code",
        };
      },
    },
  }),
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
  }
) => {
  const { name, description, hidden } = options ?? {};
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
  });
};
