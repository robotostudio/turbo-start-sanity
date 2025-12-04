import { defineType } from 'sanity';

export default defineType({
  name: 'linkVariant',
  title: 'Link Variant',
  type: 'string',
  options: {
    list: [
      { title: 'Default', value: 'default' },
      { title: 'Button Primary', value: 'primary' },
      { title: 'Button Secondary', value: 'secondary' },
      { title: 'Button Outline', value: 'outline' },
      { title: 'Button Ghost', value: 'ghost' },
    ],
    layout: 'radio',
  },
  initialValue: 'default',
})