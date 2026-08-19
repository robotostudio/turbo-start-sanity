import {
  buttonsFragment,
  imageFields,
  muxVideoFields,
  richTextFragment,
} from "../internal/groq-fragments";

/** The poster keeps the full image shape so it renders through SanityImage. */
const videoVariantFields = /* groq */ `
  mux {
    ${muxVideoFields}
  },
  poster {
    ${imageFields}
  }
`;

const heroVideoFragment = /* groq */ `
  video {
    light {
      ${videoVariantFields}
    },
    dark {
      ${videoVariantFields}
    }
  }
`;

export const heroGroqProjection = /* groq */ `
  _type == "hero" => {
    ...,
    ${heroVideoFragment},
    ${buttonsFragment},
    ${richTextFragment}
  }
`;
