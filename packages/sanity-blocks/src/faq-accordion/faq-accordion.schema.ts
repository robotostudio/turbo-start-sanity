import { MessageCircle } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

export const faqAccordionSchema = defineType({
  name: "faqAccordion",
  type: "object",
  icon: MessageCircle,
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      title: "Eyebrow",
      description:
        "The smaller text that sits above the title to provide context",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "The large text that is the primary focus of the block",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "subtitle",
      type: "string",
      title: "Subtitle",
      description: "Additional context below the main title",
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "object",
      description: "Optional link for additional content or actions",
      fields: [
        defineField({
          name: "title",
          type: "string",
          title: "Link Title",
          description: "The text to display for the link",
        }),
        defineField({
          name: "description",
          type: "string",
          title: "Link Description",
          description: "A brief description of where the link leads to",
        }),
        defineField({
          name: "url",
          type: "customUrl",
          title: "URL",
          description: "The destination URL for the link",
        }),
      ],
    }),
    defineField({
      name: "categories",
      type: "array",
      title: "Categories",
      description:
        "Groups of questions shown as a switchable list. The first category is shown by default; visitors click a category to reveal its questions.",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqCategory",
          title: "Category",
          fields: [
            defineField({
              name: "title",
              type: "string",
              title: "Category Title",
              description:
                'The label shown in the left-hand category list (for example "Components" or "Pricing")',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "faqs",
              type: "array",
              title: "FAQs",
              description:
                "Choose the questions and answers shown when this category is selected. Add them in the order you want visitors to see them.",
              of: [
                defineArrayMember({
                  type: "reference",
                  to: [{ type: "faq" }],
                  // Weak so a category can reference draft/unpublished FAQ docs
                  // without failing mutations or triggering a strength mismatch.
                  weak: true,
                  options: { disableNew: true },
                }),
              ],
              validation: (Rule) => [Rule.required(), Rule.unique()],
            }),
          ],
          preview: {
            select: {
              title: "title",
              faqs: "faqs",
            },
            prepare: ({ title, faqs }) => ({
              title: title ?? "Untitled category",
              subtitle: `${faqs?.length ?? 0} FAQ${
                faqs?.length === 1 ? "" : "s"
              }`,
            }),
          },
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
      subtitle: "FAQ Accordion",
    }),
  },
});

// Backward-compatible alias for existing consumers.
export const faqAccordion = faqAccordionSchema;
