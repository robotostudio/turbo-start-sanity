import { richTextFragment } from "../internal/groq-fragments";

export const featureCardsIconGroqProjection = /* groq */ `
  _type == "featureCardsIcon" => {
    ...,
    ${richTextFragment},
    "cards": array::compact(cards[]{
      ...,
      ${richTextFragment},
    })
  }
`;
