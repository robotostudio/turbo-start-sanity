import { defineField } from "sanity";

import { PathnameFieldComponent } from "@/components/slug-field-component";
import { GROUP } from "@/utils/constant";
import {
  createSlugErrorValidator,
  createSlugWarningValidator,
  getDocumentTypeConfig,
} from "@/utils/slug-validation";

export {
  buttonsField,
  iconField,
  imageWithAltField,
} from "@workspace/sanity-blocks/internal/schema-fields";

export const richTextField = defineField({
  name: "richText",
  type: "richText",
  description:
    "A text editor that lets you add formatting like bold text, links, and bullet points",
});

export const pageBuilderField = defineField({
  name: "pageBuilder",
  group: GROUP.MAIN_CONTENT,
  type: "pageBuilder",
  description:
    "Build your page by adding different sections like text, images, and other content blocks",
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
        Rule.custom(createSlugWarningValidator(config)).warning(),
      ];
    },
  });
};
