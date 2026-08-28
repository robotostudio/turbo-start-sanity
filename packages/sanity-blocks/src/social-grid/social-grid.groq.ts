import { imageFields, urlFragment } from "../internal/groq-fragments";

export const socialGridGroqProjection = /* groq */ `
  _type == "socialGrid" => {
    ...,
    "socials": array::compact(socials[]{
      ...,
      ${urlFragment},
      "logo": logo{
        ${imageFields}
      }
    })
  }
`;
