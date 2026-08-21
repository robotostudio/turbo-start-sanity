import {
  muxVideoEmbedFields,
  richTextFragment,
} from "../internal/groq-fragments";

export const videoFeatureGroqProjection = /* groq */ `
  _type == "videoFeature" => {
    ...,
    ${richTextFragment},
    video {
      ${muxVideoEmbedFields}
    },
  }
`;
