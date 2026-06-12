import { definePortableTextField } from "@workspace/sanity-blocks/internal/schema-fields";
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
