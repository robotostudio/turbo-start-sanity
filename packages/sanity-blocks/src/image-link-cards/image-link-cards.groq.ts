import {
  buttonsFragment,
  imageFragment,
  richTextFragment,
  urlFragment,
} from "../internal/groq-fragments";

export const imageLinkCardsGroqProjection = /* groq */ `
  _type == "imageLinkCards" => {
    ...,
    ${richTextFragment},
    ${buttonsFragment},
    "cards": array::compact(cards[]{
      ...,
      ${urlFragment},
      ${imageFragment},
    })
  }
`;
