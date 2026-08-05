import { imageFragment, urlFragment } from "../internal/groq-fragments";

export const logoCloudGroqProjection = /* groq */ `
  _type == "logoCloud" => {
    ...,
    "logos": array::compact(logos[]{
      ...,
      ${urlFragment},
      ${imageFragment},
    })
  }
`;
