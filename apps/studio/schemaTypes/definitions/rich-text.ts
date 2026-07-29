import {
  definePortableTextField,
  portableTextMemberTypes,
} from "@workspace/sanity-blocks/internal/sanity-rich-text";
import { defineType } from "sanity";

// Reuse the shared portable-text members from @workspace/sanity-blocks instead
// of redefining them (notably the code block) here.
export const richText = defineType({
  name: "richText",
  type: "array",
  of: definePortableTextField(portableTextMemberTypes).of,
});

export const memberTypes = portableTextMemberTypes;

export const customRichText = definePortableTextField;
