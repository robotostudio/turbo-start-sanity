import { defineField } from "sanity";

import { PathnameFieldComponent } from "@/components/slug-field-component";
import { GROUP } from "@/utils/constant";
import {
  createSlugErrorValidator,
  createSlugUniqueValidator,
  createSlugWarningValidator,
  getDocumentTypeConfig,
} from "@/utils/slug-validation";

export {
  buttonsField,
  iconField,
  imageWithAltField,
} from "@workspace/sanity-blocks/internal/schema-fields";

export const pageBuilderField = defineField({
  name: "pageBuilder",
  type: "pageBuilder",
  description:
    "Build your page by adding different sections like text, images, and other content blocks",
  group: GROUP.MAIN_CONTENT,
});

export const documentSlugField = (
  documentType: string,
  options: {
    group?: string;
    description?: string;
    title?: string;
  } = {}
) => {
  const {
    group,
    description = `The web address where people can find your ${documentType} (automatically created from title)`,
    title = "URL",
  } = options;

  return defineField({
    name: "slug",
    type: "slug",
    title,
    description,
    group,
    components: {
      field: PathnameFieldComponent,
    },
    validation: (Rule) => {
      const config = getDocumentTypeConfig(documentType);
      return [
        Rule.custom(createSlugErrorValidator(config)),
        Rule.custom(createSlugUniqueValidator()),
        Rule.custom(createSlugWarningValidator(config)).warning(),
      ];
    },
  });
};
