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
      _key,
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
`;
