import { FaqAccordion } from '@workspace/sanity-blocks/faq-accordion/index'

const meta = {
  title: 'Blocks/Faq Accordion',
  component: FaqAccordion,
  args: {
    eyebrow: 'Support',
    title: 'Common migration questions',
    subtitle: 'Answer the expected setup questions before launch.',
    link: {
      title: 'Read the docs',
      description: 'Open the implementation guide.',
      href: 'https://example.com',
    },
    faqs: [
      {
        _id: 'faq-1',
        title: 'Where do block schemas live?',
        richText: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'They now live in packages/sanity-blocks/src.',
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
