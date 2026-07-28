import {
  definePortableTextField,
  imageWithAltField,
} from "@workspace/sanity-blocks/internal/schema-fields";
import { Mail } from "lucide-react";
import { defineField, defineType } from "sanity";

export const subscribeNewsletterSchema = defineType({
  name: "subscribeNewsletter",
  title: "Subscribe Newsletter",
  type: "object",
  icon: Mail,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
    }),
    definePortableTextField(["block"], {
      name: "subTitle",
      title: "SubTitle",
    }),
    definePortableTextField(["block"], {
      name: "helperText",
      title: "Helper Text",
    }),
    defineField({
      name: "testimonial",
      title: "Testimonial",
      type: "object",
      description:
        "An optional customer testimonial shown in a panel beside the newsletter form. Leave every field empty to hide the panel entirely.",
      fields: [
        defineField({
          name: "eyebrow",
          title: "Eyebrow",
          type: "string",
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
          title: "Author Name",
          type: "string",
          description:
            'The full name of the person giving the testimonial, for example "Jane Doe"',
        }),
        defineField({
          name: "authorRole",
          title: "Author Role",
          type: "string",
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
