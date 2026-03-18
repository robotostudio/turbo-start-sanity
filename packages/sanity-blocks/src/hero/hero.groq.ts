export const heroGroqProjection = /* groq */ `
  _type == "hero" => {
    _type,
    badge,
    title,
    richText[]{
      ...,
      children[]{
        ...
      }
    },
    image{
      ...,
      alt
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
