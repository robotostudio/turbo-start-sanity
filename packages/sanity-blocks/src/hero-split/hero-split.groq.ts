import { buttonsFragment, imageFragment } from "../internal/groq-fragments";

export const heroSplitGroqProjection = /* groq */ `
  _type == "heroSplit" => {
    ...,
    ${imageFragment},
    ${buttonsFragment},
  }
`;
