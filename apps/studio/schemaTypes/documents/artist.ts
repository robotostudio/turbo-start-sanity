import { UserIcon } from '@sanity/icons'
import { defineArrayMember, defineType } from 'sanity'

export default defineType({
  type: 'document',
  name: 'artist',
  title: 'Artist',
  icon: UserIcon,
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',

      validation: (Rule) => Rule.required(),
      options: {
        source: 'name',
        maxLength: 96,
      },
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
        }),
      ],
    },
    {
      name: 'portrait',
      title: 'Portrait',
      type: 'image',
    },
  ],
})
