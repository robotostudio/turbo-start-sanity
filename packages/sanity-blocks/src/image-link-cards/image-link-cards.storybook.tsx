import { ImageLinkCards } from '@workspace/sanity-blocks/image-link-cards/index'

const meta = {
  title: 'Blocks/Image Link Cards',
  component: ImageLinkCards,
  args: {
    eyebrow: 'Browse patterns',
    title: 'Prebuilt block examples',
    cards: [
      {
        _key: 'card-1',
        title: 'Hero',
        description: 'Lead with a title, rich text, and buttons.',
        image: {
          alt: 'Hero preview',
        },
        href: 'https://example.com/hero',
      },
    ],
  },
}

export default meta

export const Default = {}
