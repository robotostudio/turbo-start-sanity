import { ImageIcon, LinkIcon } from '@sanity/icons'
import {
  type ConditionalProperty,
  defineArrayMember,
  defineField,
} from 'sanity'

// Single source of truth for portable text member names
const PORTABLE_TEXT_MEMBER_NAMES = {
  block: 'block',
  image: 'image',
} as const

const richTextMembers = [
  defineArrayMember({
    name: PORTABLE_TEXT_MEMBER_NAMES.block,
    type: 'block',
    styles: [
      { title: 'Normal', value: 'normal' },
      { title: 'H2', value: 'h2' },
      { title: 'H3', value: 'h3' },
      { title: 'H4', value: 'h4' },
      { title: 'H5', value: 'h5' },
      { title: 'H6', value: 'h6' },
      { title: 'Inline', value: 'inline' },
    ],
    lists: [
      { title: 'Numbered', value: 'number' },
      { title: 'Bullet', value: 'bullet' },
    ],
    marks: {
      annotations: [
        {
          name: 'customLink',
          type: 'object',
          title: 'Internal/External Link',
          icon: LinkIcon,
          fields: [
            defineField({
              name: 'customLink',
              type: 'customUrl',
            }),
          ],
        },
      ],
      decorators: [
        { title: 'Strong', value: 'strong' },
        { title: 'Emphasis', value: 'em' },
        { title: 'Code', value: 'code' },
      ],
    },
  }),
  defineArrayMember({
    name: PORTABLE_TEXT_MEMBER_NAMES.image,
    title: 'Image',
    type: 'image',
    icon: ImageIcon,
    options: {
      hotspot: true,
    },
    fields: [
      defineField({
        name: 'caption',
        title: 'Caption Text',
        type: 'string',
      }),
    ],
  }),
]

export const portableTextMemberTypes = Object.values(PORTABLE_TEXT_MEMBER_NAMES)

export type PortableTextMemberType = (typeof portableTextMemberTypes)[number];

export const definePortableTextField = (
  memberTypes: PortableTextMemberType[],
  options?: {
    description?: string
    group?: string[] | string
    hidden?: ConditionalProperty
    name?: string
    title?: string
  },
) => {
  if (memberTypes.length === 0) {
    throw new Error('definePortableTextField requires at least one member type')
  }

  const invalidMemberTypes = memberTypes.filter(
    (type) => !portableTextMemberTypes.includes(type),
  )
  if (invalidMemberTypes.length > 0) {
    throw new Error(
      `definePortableTextField received unsupported member types: ${invalidMemberTypes.join(', ')}`,
    )
  }

  const { description = '', hidden, name = 'richText' } = options ?? {}
  const selectedMembers = richTextMembers.filter(
    (member) => member.name && memberTypes.includes(member.name),
  )

  return defineField({
    ...options,
    name,
    description,
    hidden,
    type: 'array',
    of: selectedMembers,
  })
}
