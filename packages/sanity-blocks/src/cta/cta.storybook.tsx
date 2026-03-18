import { CTABlock } from '@workspace/sanity-blocks/cta/index'

const meta = {
  title: 'Blocks/Cta',
  component: CTABlock,
  args: {
    eyebrow: 'Talk to the team',
    title: 'Need a migration plan?',
    richText: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'This CTA keeps shared actions consistent.',
          },
        ],
      },
    ],
    buttons: [
      {
        _key: 'btn-1',
        text: 'Book a call',
        href: 'https://example.com',
      },
    ],
  },
}

export default meta

export const Default = {}
