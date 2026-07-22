import {
  buttonsFragment,
  imageFields,
  richTextFragment,
} from "../internal/groq-fragments";

/**
 * File assets carry no LQIP or dimensions, so only the URL is worth resolving.
 * The poster keeps the full image shape so it renders through SanityImage.
 */
const videoVariantFields = /* groq */ `
  "webm": webm.asset->url,
  "hevc": hevc.asset->url,
  "mobileWebm": mobileWebm.asset->url,
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
