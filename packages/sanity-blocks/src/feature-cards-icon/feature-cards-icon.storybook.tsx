import { FeatureCardsWithIcon } from '@workspace/sanity-blocks/feature-cards-icon/index'

const meta = {
  title: 'Blocks/Feature Cards Icon',
  component: FeatureCardsWithIcon,
  args: {
    eyebrow: 'Why this package',
    title: 'Shared building blocks',
    cards: [
      {
        _key: 'card-1',
        icon: 'boxes',
        title: 'One source of truth',
        richText: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'Studio schemas and frontend components stay aligned.',
              },
            ],
          },
        ],
      },
      {
        _key: 'card-2',
        icon: 'swatch-book',
        title: 'Colocated stories',
        richText: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'Every block carries its own example usage.',
              },
            ],
          },
        ],
      },
    ],
  },
}

export default meta

export const Default = {}
