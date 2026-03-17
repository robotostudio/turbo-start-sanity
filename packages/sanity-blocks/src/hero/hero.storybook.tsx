import { HeroBlock } from '@workspace/sanity-blocks/hero/index'

const meta = {
  title: 'Blocks/Hero',
  component: HeroBlock,
  args: {
    badge: 'Launch Week',
    title: 'Build pages with reusable blocks',
    richText: [
      {
        _type: 'block',
        children: [
          { _type: 'span', text: 'Move block schemas into one package.' },
        ],
      },
    ],
    image: {
      alt: 'Dashboard preview',
    },
    buttons: [
      {
        _key: 'btn-1',
        text: 'Get started',
        href: 'https://example.com',
      },
    ],
  },
}

export default meta

export const Default = {}
