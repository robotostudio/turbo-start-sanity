export const featureCardsIconGroqProjection = /* groq */ `
  _type == "featureCardsIcon" => {
    _type,
    eyebrow,
    title,
    richText[]{
      ...,
      children[]{
        ...
      }
    },
    cards[]{
      icon,
      title,
      richText[]{
        ...,
        children[]{
          ...
        }
      }
    }
  }
`
