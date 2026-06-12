export const subscribeNewsletterGroqProjection = /* groq */ `
  _type == "subscribeNewsletter" => {
    _type,
    title,
    subTitle[]{
      ...,
      children[]{
        ...
      }
    },
    helperText[]{
      ...,
      children[]{
        ...
      }
    }
  }
`
