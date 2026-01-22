import { defineArrayMember, defineType } from "sanity";

import { pageBuilderBlocks } from "@/schemaTypes/blocks/index";
import { convertToKebabCase } from "@/utils/helper";

export const pagebuilderBlockTypes = pageBuilderBlocks.map(({ name }) => ({
  type: name,
}));

export const pageBuilder = defineType({
  name: "pageBuilder",
  type: "array",
  of: pagebuilderBlockTypes.map((block) => defineArrayMember(block)),
  options: {
    insertMenu: {
      views: [
        {
          name: "grid",
          previewImageUrl: (schemaTypeName) => {
            const kebabCaseType = convertToKebabCase(schemaTypeName);
            return `/static/thumbnails/preview-${kebabCaseType}.jpg`;
          },
        },
      ],
    },
  },
});
