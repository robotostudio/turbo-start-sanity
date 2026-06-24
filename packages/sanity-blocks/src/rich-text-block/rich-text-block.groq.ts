import { richTextFragment } from "../internal/groq-fragments";

export const richTextBlockGroqProjection = /* groq */ `
  _type == "richTextBlock" => {
    ...,
    ${richTextFragment}
  }
`;
