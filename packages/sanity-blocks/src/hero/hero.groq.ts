import {
  buttonsFragment,
  imageFields,
  muxVideoFields,
  richTextFragment,
} from "../internal/groq-fragments";

/**
 * Both delivery paths, always. `mediaType` decides which one renders, but the
 * projection carries the other too — an editor flipping the toggle in
 * Presentation would otherwise watch the background vanish until the query
 * re-ran. File assets carry no LQIP or dimensions, so only the URL is worth
 * resolving; the poster keeps the full image shape so it renders through
 * SanityImage.
 */
const videoVariantFields = /* groq */ `
  mediaType,
  mux {
    ${muxVideoFields}
  },
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
