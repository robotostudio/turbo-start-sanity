export const richTextBlockGroqProjection = /* groq */ `
  _type == "richTextBlock" => {
    _type,
    eyebrow,
    title,
    richText[]{
      ...,
      children[]{
        ...
      }
    }
  }
`
