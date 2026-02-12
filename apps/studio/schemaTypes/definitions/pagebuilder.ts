import { defineArrayMember, defineType } from "sanity";

import { pageBuilderBlocks } from "@/schemaTypes/blocks/index";

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
            const kebabCaseName = schemaTypeName
              .replace(/([a-z])([A-Z])/g, "$1-$2")
              .toLowerCase();
            const filePath = `/static/thumbnails/preview-${kebabCaseName}.png`;
            return filePath;
          },
        },
      ],
    },
  },
});
