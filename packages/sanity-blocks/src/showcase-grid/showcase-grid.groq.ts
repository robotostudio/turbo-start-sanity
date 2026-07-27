import { imageFields } from "../internal/groq-fragments";

export const showcaseGridGroqProjection = /* groq */ `
  _type == "showcaseGrid" => {
    ...,
    "items": array::compact(items[]{
      _key,
      siteName,
      url,
      category,
      "screenshot": screenshot{
        ${imageFields}
      },
      "attributionLogo": attributionLogo{
        ${imageFields}
      },
      featured
    })
  }
`;
