// schemas/redirect.ts
import {defineType, defineField} from 'sanity'

export const redirect = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  description: 'Redirect for next.config.js',
  fields: [
    defineField({
      name: 'source',
      type: 'slug',
      validation: (rule) => rule.required().custom((value) => {
        if (!value || !value.current) return "Can't be blank"
        if (!value.current.startsWith('/')) {
          return 'The path must start with a /'
        }
        return true
      })
    }),
    defineField({
      name: 'destination',
      type: 'slug',
      validation: (rule) => rule.required().custom((value) => {
        if (!value || !value.current) return "Can't be blank"
        if (!value.current.startsWith('/')) {
          return 'The path must start with a /'
        }
        return true
      })
    }),
    defineField({
      name: 'permanent',
      type: 'boolean',
    }),
  ],
  initialValue: {
    permanent: true,
  },
})