import { JsonIcon } from "@sanity/icons";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import { File, type LucideIcon, Settings2 } from "lucide-react";
import type {
  ListItemBuilder,
  StructureBuilder,
  StructureResolverContext,
} from "sanity/structure";

import { createSlugBasedStructure } from "./components/nested-pages-structure";
import type { SchemaType, SingletonType } from "./schemaTypes";
import { getStructureIcon } from "./utils/document-icons";
import { getTitleCase } from "./utils/helper";

type Base<T = SchemaType> = {
  id?: string;
  type: T;
  preview?: boolean;
  title?: string;
  icon?: LucideIcon;
};

type CreateSingleTon = {
  S: StructureBuilder;
} & Base<SingletonType>;

const createSingleTon = ({ S, type, title, icon }: CreateSingleTon) => {
  const newTitle = title ?? getTitleCase(type);
  return S.listItem()
    .title(newTitle)
    .icon(icon ?? File)
    .child(S.document().schemaType(type).documentId(type));
};

type CreateList = {
  S: StructureBuilder;
} & Base;

// This function creates a list item for a type. It takes a StructureBuilder instance (S),
// a type, an icon, and a title as parameters. It generates a title for the type if not provided,
// and uses a default icon if not provided. It then returns a list item with the generated or
// provided title and icon.

const createList = ({ S, type, icon, title, id }: CreateList) => {
  const newTitle = title ?? getTitleCase(type);
  return S.documentTypeListItem(type)
    .id(id ?? type)
    .title(newTitle)
    .icon(icon ?? File);
};

type CreateIndexList = {
  S: StructureBuilder;
  list: Base;
  index: Base<SingletonType>;
  context: StructureResolverContext;
};

export const structure = (S: StructureBuilder) =>
  S.list()
    .title("Content")
    .items([
      createSingleTon({
        S,
        type: "homePage",
        icon: getStructureIcon("homePage"),
      }),
      S.divider(),
      createSlugBasedStructure(S, "page"),
      createSlugBasedStructure(S, "collection"),
      // createIndexListWithOrderableItems({
      //   S,
      //   index: {
      //     type: "collectionIndex",
      //     icon: getStructureIcon("collectionIndex"),
      //   },
      //   list: {
      //     type: "collection",
      //     title: "collections",
      //     icon: getStructureIcon("collection"),
      //   },
      //   context,
      // }),
      createList({
        S,
        type: "redirect",
        title: "Redirects",
        icon: getStructureIcon("redirect"),
      }),
      S.divider(),
      createSingleTon({
        S,
        type: "navbar",
        title: "Navigation",
        icon: getStructureIcon("navbar"),
      }),
      createSingleTon({
        S,
        type: "footer",
        title: "Footer",
        icon: getStructureIcon("footer"),
      }),
      S.listItem()
        .title("Site Configuration")
        .icon(Settings2)
        .child(
          S.list()
            .title("Site Configuration")
            .items([
              createSingleTon({
                S,
                type: "settings",
                title: "Global Settings",
                icon: getStructureIcon("settings"),
              }),
            ])
        ),
      S.divider(),
      // list default document list under developer tools list
      S.listItem()
        .title("Developer Tools")
        .id("developer-tools")
        .icon(JsonIcon)
        .child(
          S.list()
            .id("developer-tools-list")
            .items(S.documentTypeListItems() as ListItemBuilder[])
        ),
    ]);
