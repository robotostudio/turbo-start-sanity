import {
  buttonsFragment,
  imageFragment,
  richTextFragment,
} from "../internal/groq-fragments";

export const heroGroqProjection = /* groq */ `
  _type == "hero" => {
    ...,
    ${imageFragment},
    ${buttonsFragment},
    ${richTextFragment}
  }
`;
