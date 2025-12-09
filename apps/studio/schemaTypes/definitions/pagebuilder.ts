import { defineArrayMember, defineType } from "sanity";

import { pageBuilderBlocks } from "@/schemaTypes/blocks/index";

export const pagebuilderBlockTypes = pageBuilderBlocks.map(({ name }) => ({
  type: name,
}));

export const pageBuilder = defineType({
  name: "pageBuilder",
  type: "array",
  of: pagebuilderBlockTypes.map((block) => defineArrayMember(block)),
});
