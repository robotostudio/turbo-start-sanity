import { MessageCircle } from "lucide-react";
import { defineField, defineType } from "sanity";

import { parseRichTextToString } from "../../utils/helper";
import { customRichText } from "../definitions/rich-text";

export const faq = defineType({
  name: "faq",
  type: "document",
  title: "Frequently Asked Question",
  description:
    "A simple question and answer pair that helps visitors find information quickly. Think of it like writing down the questions customers often ask, along with clear answers.",
  icon: MessageCircle,
  fields: [
    defineField({
      name: "title",
      title: "Question",
      type: "string",
      description:
        "Write the question exactly as someone might ask it. For example: 'How do I reset my password?'",
      validation: (Rule) => Rule.required(),
    }),
    customRichText(["block"], {
      title: "Answer",
      description:
        "Write a friendly, clear answer that directly addresses the question. Keep it simple enough that anyone can understand it.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      richText: "richText",
    },
    prepare: ({ title, richText }) => {
      // Create a playful subtitle with emojis
      const subtitle = `${parseRichTextToString(richText, 20)}`;

      return {
        title: `❓ ${title || "Untitled Question"}`,
        subtitle,
      };
    },
  },
});
