import type { SlugifierFn } from "sanity";
import {
  defineField,
  type FieldDefinition,
  getDraftId,
  getPublishedId,
  type SlugValidationContext,
} from "sanity";
import slugify from "slugify";

import type { PathnameParams } from "./types";

export function defineSlug(
  schema: PathnameParams = { name: "slug" },
): FieldDefinition<"slug"> {
  const slugOptions = schema?.options;

  return defineField({
    ...schema,
    name: schema.name ?? "slug",
    title: schema?.title ?? "URL",
    type: "slug",
    components: {
      ...schema.components,
      // field: schema.components?.field ?? PathnameFieldComponent,
    },
    options: {
      ...(slugOptions ?? {}),
      isUnique: slugOptions?.isUnique ?? isUnique,
    },
  });
}

export async function isUnique(
  slug: string,
  context: SlugValidationContext,
): Promise<boolean> {
  const { document, getClient } = context;
  const client = getClient({ apiVersion: "2025-02-10" });
  const id = getPublishedId(document?._id ?? "");
  const draftId = getDraftId(id);

  // Get the current document's language for internationalization support
  const currentLanguage = document?.language;

  const params = {
    draft: draftId,
    published: id,
    slug,
    language: currentLanguage,
  };

  // For documents with language field (internationalized), check uniqueness within the same language
  // For documents without language field, check global uniqueness
  const query = currentLanguage
    ? "*[!(_id in [$draft, $published]) && slug.current == $slug && language == $language]"
    : "*[!(_id in [$draft, $published]) && slug.current == $slug]";

  const result = await client.fetch(query, params);
  return result.length === 0;
}

// Language-aware uniqueness function for internationalized documents
export async function isUniqueForLanguage(
  slug: string,
  context: SlugValidationContext,
): Promise<boolean> {
  const { document, getClient } = context;
  const client = getClient({ apiVersion: "2025-02-10" });
  const id = getPublishedId(document?._id ?? "");
  const draftId = getDraftId(id);
  const currentLanguage = document?.language;

  if (!currentLanguage) {
    // Fallback to regular uniqueness check if no language
    return isUnique(slug, context);
  }

  const params = {
    draft: draftId,
    published: id,
    slug,
    language: currentLanguage,
  };

  const query =
    "*[!(_id in [$draft, $published]) && slug.current == $slug && language == $language]";
  const result = await client.fetch(query, params);
  return result.length === 0;
}

export const getDocTypePrefix = (type: string) => {
  if (["page"].includes(type)) return "";
  return type;
};

const slugMapper = {
  homePage: "/",
  blogIndex: "/blog",
} as Record<string, string>;

export const createSlug: SlugifierFn = (input, _, { parent }) => {
  const { _type } = parent as {
    _type: string;
  };

  if (slugMapper[_type]) return slugMapper[_type];

  const prefix = getDocTypePrefix(_type);

  const slug = slugify(input, {
    lower: true,
    remove: /[^a-zA-Z0-9 ]/g,
  });

  return `/${[prefix, slug].filter(Boolean).join("/")}`;
};
