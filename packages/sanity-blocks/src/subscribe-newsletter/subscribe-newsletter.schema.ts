import {
  definePortableTextField,
  imageWithAltField,
} from "@workspace/sanity-blocks/internal/schema-fields";
import { Mail } from "lucide-react";
import { defineField, defineType } from "sanity";

export const subscribeNewsletterSchema = defineType({
  name: "subscribeNewsletter",
  type: "object",
  title: "Subscribe Newsletter",
  icon: Mail,
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The main heading shown above the sign-up form",
    }),
    definePortableTextField(["block"], {
      name: "subTitle",
      title: "SubTitle",
      description:
        "The short paragraph beneath the title, telling visitors what they will receive",
    }),
    definePortableTextField(["block"], {
      name: "helperText",
      title: "Helper Text",
      description:
        "The small print under the form, for example how often you send emails or a link to your privacy policy",
    }),
    defineField({
      name: "testimonial",
      type: "object",
      title: "Testimonial",
      description:
        "An optional customer testimonial shown in a panel beside the newsletter form. Leave every field empty to hide the panel entirely.",
      fields: [
        defineField({
          name: "eyebrow",
          type: "string",
          title: "Eyebrow",
          description:
            'The small uppercase label above the quote, for example "Testimonials"',
        }),
        definePortableTextField(["block"], {
          name: "quote",
          title: "Quote",
          description:
            "The testimonial quote. Use the Strong style to emphasize the sentences that should stand out brightly; the rest of the text appears muted.",
        }),
        defineField({
          name: "authorName",
          type: "string",
          title: "Author Name",
          description:
            'The full name of the person giving the testimonial, for example "Jane Doe"',
        }),
        defineField({
          name: "authorRole",
          type: "string",
          title: "Author Role",
          description:
            'The job title and company of the person, for example "CEO at Acme Inc"',
        }),
        imageWithAltField({
          name: "authorImage",
          title: "Author Image",
          description:
            "A photo of the person giving the testimonial, shown as a small rounded avatar. Remember to add alt text.",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare: ({ title }) => ({
      title: title ?? "Untitled",
      subtitle: "Subscribe Newsletter",
    }),
  },
});
