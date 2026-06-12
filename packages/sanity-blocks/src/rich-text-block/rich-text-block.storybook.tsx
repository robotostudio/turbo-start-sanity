import { RichTextBlock } from '@workspace/sanity-blocks/rich-text-block/index'

const meta = {
  title: 'Blocks/Rich Text Block',
  component: RichTextBlock,
  args: {
    eyebrow: 'Editorial',
    title: 'Long-form content',
    richText: [
      {
        _type: 'block',
        style: 'h3',
        children: [
          { _type: 'span', text: 'Shared rich text stays predictable.' },
        ],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'This block supports text and inline images.',
          },
        ],
      },
    ],
  },
}

export default meta

export const Default = {}
