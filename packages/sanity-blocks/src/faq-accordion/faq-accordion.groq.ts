import { richTextFragment, urlFragment } from "../internal/groq-fragments";

export const faqAccordionGroqProjection = /* groq */ `
  _type == "faqAccordion" => {
    ...,
    "eyebrow": coalesce(eyebrow, null),
    "faqs": array::compact(faqs[]->{
      title,
      _id,
      _type,
      ${richTextFragment}
    }),
    link{
      ...,
      ${urlFragment}
    }
  }
`;
