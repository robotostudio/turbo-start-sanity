import { CodeBlockIcon } from "@sanity/icons/CodeBlock";
import { ImageIcon } from "@sanity/icons/Image";
import { LinkIcon } from "@sanity/icons/Link";
import { ThLargeIcon } from "@sanity/icons/ThLarge";
import {
  type ConditionalProperty,
  defineArrayMember,
  defineField,
} from "sanity";

// Single source of truth for portable text member names
const PORTABLE_TEXT_MEMBER_NAMES = {
  block: "block",
  image: "image",
  code: "code",
  table: "table",
} as const;

const CODE_LANGUAGES = [
  { title: "TypeScript", value: "ts" },
  { title: "TSX", value: "tsx" },
  { title: "JavaScript", value: "js" },
  { title: "GROQ", value: "groq" },
  { title: "Bash", value: "bash" },
  { title: "JSON", value: "json" },
  { title: "CSS", value: "css" },
];

const PORTABLE_TEXT_BLOCK_STYLES = [
  { title: "Normal", value: "normal" },
  { title: "H2", value: "h2" },
  { title: "H3", value: "h3" },
  { title: "H4", value: "h4" },
  { title: "H5", value: "h5" },
  { title: "H6", value: "h6" },
  { title: "Inline", value: "inline" },
];

const TABLE_CELL_BLOCK_STYLES = [{ title: "Normal", value: "normal" }];

const customLinkAnnotation = {
  name: "customLink",
  type: "object",
  title: "Internal/External Link",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "customLink",
      type: "customUrl",
      description:
        "Where the highlighted text takes visitors — pick a page on this site or paste a web address",
    }),
  ],
};

const PORTABLE_TEXT_MARK_DECORATORS = [
  { title: "Strong", value: "strong" },
  { title: "Emphasis", value: "em" },
  { title: "Code", value: "code" },
];

const PORTABLE_TEXT_MARKS = {
  annotations: [customLinkAnnotation],
  decorators: PORTABLE_TEXT_MARK_DECORATORS,
};

const richTextMembers = [
  defineArrayMember({
    name: PORTABLE_TEXT_MEMBER_NAMES.block,
    type: "block",
    styles: PORTABLE_TEXT_BLOCK_STYLES,
    lists: [
      { title: "Numbered", value: "number" },
      { title: "Bullet", value: "bullet" },
    ],
    marks: PORTABLE_TEXT_MARKS,
  }),
  defineArrayMember({
    name: PORTABLE_TEXT_MEMBER_NAMES.image,
    type: "image",
    title: "Image",
    icon: ImageIcon,
    options: {
      hotspot: true,
    },
    fields: [
      defineField({
        name: "alt",
        type: "string",
        title: "Alternative Text",
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
    name: PORTABLE_TEXT_MEMBER_NAMES.code,
    type: "object",
    title: "Code Block",
    description:
      "A multi-line code snippet with preserved indentation. Use this for code examples instead of the inline Code style.",
    icon: CodeBlockIcon,
    fields: [
      defineField({
        name: "code",
        type: "text",
        title: "Code",
        description: "The code snippet. Indentation and line breaks are kept.",
        rows: 8,
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: "language",
        type: "string",
        title: "Language",
        description: "Optional language label shown in the code block header.",
        options: {
          list: CODE_LANGUAGES,
        },
      }),
      defineField({
        name: "filename",
        type: "string",
        title: "Filename",
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
  defineArrayMember({
    name: PORTABLE_TEXT_MEMBER_NAMES.table,
    type: "object",
    title: "Table",
    // The Portable Text table plugin (bundled with `sanity` v6.6+, enabled
    // in sanity.config.ts) strips fields the schema doesn't declare — omitting
    // `headerRows` would silently break the header-row toggle, so it's
    // required here even though the editor UI manages it directly.
    icon: ThLargeIcon,
    fields: [
      defineField({
        name: "headerRows",
        type: "number",
        title: "Header Rows",
        description: "How many rows at the top of the table are headers.",
      }),
      defineField({
        name: "rows",
        type: "array",
        title: "Rows",
        of: [
          defineArrayMember({
            name: "row",
            type: "object",
            fields: [
              defineField({
                name: "cells",
                type: "array",
                title: "Cells",
                of: [
                  defineArrayMember({
                    name: "cell",
                    type: "object",
                    fields: [
                      defineField({
                        name: "value",
                        type: "array",
                        of: [
                          defineArrayMember({
                            type: "block",
                            styles: TABLE_CELL_BLOCK_STYLES,
                            marks: PORTABLE_TEXT_MARKS,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
    preview: {
      select: {
        rows: "rows",
      },
      prepare({ rows }) {
        const rowCount = Array.isArray(rows) ? rows.length : 0;
        const columnCount = Array.isArray(rows?.[0]?.cells)
          ? rows[0].cells.length
          : 0;
        return {
          title:
            rowCount && columnCount
              ? `${rowCount}×${columnCount} Table`
              : "Table",
        };
      },
    },
  }),
];

export const portableTextMemberTypes = Object.values(
  PORTABLE_TEXT_MEMBER_NAMES
);

export type PortableTextMemberType = (typeof portableTextMemberTypes)[number];

export const definePortableTextField = (
  memberTypes: PortableTextMemberType[],
  options?: {
    description?: string;
    group?: string[] | string;
    hidden?: ConditionalProperty;
    name?: string;
    title?: string;
  }
) => {
  if (memberTypes.length === 0) {
    throw new Error(
      "definePortableTextField requires at least one member type"
    );
  }

  const invalidMemberTypes = memberTypes.filter(
    (type) => !portableTextMemberTypes.includes(type)
  );
  if (invalidMemberTypes.length > 0) {
    throw new Error(
      `definePortableTextField received unsupported member types: ${invalidMemberTypes.join(", ")}`
    );
  }

  const { description = "", hidden, name = "richText" } = options ?? {};
  const selectedMembers = richTextMembers.filter(
    (member) => member.name && memberTypes.includes(member.name)
  );

  return defineField({
    ...options,
    name,
    type: "array",
    description,
    hidden,
    of: selectedMembers,
  });
};
