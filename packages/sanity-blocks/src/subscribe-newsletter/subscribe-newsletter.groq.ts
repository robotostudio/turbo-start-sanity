import { imageFields, markDefsFragment } from "../internal/groq-fragments";

export const subscribeNewsletterGroqProjection = /* groq */ `
  _type == "subscribeNewsletter" => {
    ...,
    "subTitle": subTitle[]{
      ...,
      ${markDefsFragment}
    },
    "helperText": helperText[]{
      ...,
      ${markDefsFragment}
    },
    "testimonial": testimonial{
      eyebrow,
      authorName,
      authorRole,
      "quote": quote[]{
        ...,
        ${markDefsFragment}
      },
      "authorImage": authorImage{
        ${imageFields}
      }
    }
  }
`;
