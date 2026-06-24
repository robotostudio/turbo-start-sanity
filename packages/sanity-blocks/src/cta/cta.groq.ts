import { buttonsFragment, richTextFragment } from "../internal/groq-fragments";

export const ctaGroqProjection = /* groq */ `
  _type == "cta" => {
    ...,
    ${richTextFragment},
    ${buttonsFragment},
  }
`;
