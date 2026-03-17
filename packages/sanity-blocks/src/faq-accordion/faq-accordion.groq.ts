export const faqAccordionGroqProjection = /* groq */ `
  _type == "faqAccordion" => {
    _type,
    eyebrow,
    title,
    subtitle,
    link{
      ...,
      url{
        ...,
        internal->{
          slug
        }
      }
    },
    faqs[]->{
      _id,
      question,
      answer[]{
        ...,
        children[]{
          ...
        }
      }
    }
  }
`
