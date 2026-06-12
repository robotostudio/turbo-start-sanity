export const ctaGroqProjection = /* groq */ `
  _type == "cta" => {
    _type,
    eyebrow,
    title,
    richText[]{
      ...,
      children[]{
        ...
      }
    },
    buttons[]{
      ...,
      url{
        ...,
        internal->{
          slug
        }
      }
    }
  }
`
