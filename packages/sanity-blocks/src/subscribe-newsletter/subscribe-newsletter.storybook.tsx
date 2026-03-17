import { SubscribeNewsletter } from '@workspace/sanity-blocks/subscribe-newsletter/index'

const meta = {
  title: 'Blocks/Subscribe Newsletter',
  component: SubscribeNewsletter,
  args: {
    title: 'Stay current',
    subTitle: [
      {
        _type: 'block',
        children: [
          { _type: 'span', text: 'Get release notes and schema updates.' },
        ],
      },
    ],
    helperText: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'No spam. One email a month.' }],
      },
    ],
  },
}

export default meta

export const Default = {}
