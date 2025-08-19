// apps/studio/structure.ts
import React from "react";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import {
  BookMarked,
  CogIcon,
  File,
  FileText,
  HomeIcon,
  MessageCircleQuestion,
  PanelBottomIcon,
  PanelTopDashedIcon,
  Settings2,
  User,
  TagsIcon,
  BugIcon,
  LucideIcon,
} from "lucide-react";
import type { StructureBuilder, StructureResolverContext } from "sanity/structure";
import type { SchemaType, SingletonType } from "./schemaTypes";
import { getTitleCase } from "./utils/helper";

type Base<T = SchemaType> = {
  id?: string;
  type: T;
  preview?: boolean;
  title?: string;
  icon?: LucideIcon | React.ComponentType<any>;
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

const createIndexListWithOrderableItems = ({
  S,
  index,
  list,
  context,
}: CreateIndexList) => {
  const indexTitle = index.title ?? getTitleCase(index.type);
  const listTitle = list.title ?? getTitleCase(list.type);

  return S.listItem()
    .title(listTitle)
    .icon(index.icon ?? File)
    .child(
      S.list()
        .title(indexTitle)
        .items([
          S.listItem()
            .title(indexTitle)
            .icon(index.icon ?? File)
            .child(
              S.document()
                .views([S.view.form()])
                .schemaType(index.type)
                .documentId(index.type)
            ),
          orderableDocumentListDeskItem({
            type: list.type,
            S,
            context,
            icon: list.icon ?? File,
            title: listTitle,
          }),
          S.listItem()
            .title("Categories")
            .icon(TagsIcon)
            .child(S.documentTypeList("category").title("Categories")),
        ])
    );
};

export const structure = (S: StructureBuilder, context: StructureResolverContext) => {
  return S.list()
    .title("Content")
    .items([
      // 1. Home Page
      createSingleTon({ S, type: "homePage", icon: HomeIcon }),
      S.divider(),

      // 2. Regular Pages
      createList({ S, type: "page", title: "Pages" }),

      // 3. Blog Section (with orderable posts)
      createIndexListWithOrderableItems({
        S,
        index: { type: "blogIndex", icon: BookMarked },
        list: { type: "blog", title: "Blog Posts", icon: FileText },
        context,
      }),

      // 4. FAQs
      createList({ S, type: "faq", title: "FAQs", icon: MessageCircleQuestion }),

      // 5. Authors
      createList({ S, type: "author", title: "Authors", icon: User }),

      // 6. Pokédex
     S.listItem()
  .title("Pokédex")
  .icon(BugIcon)
  .child(
    S.documentList()
      .title("Pokémon Collection")
      .schemaType("pokedex")
      .filter('_type == "pokedex"')
      .child((documentId) =>
        S.document()
          .documentId(documentId)
          .schemaType("pokedex")
          .views([
            S.view.form(),
            S.view
              .component(() => <div>Pokémon-Details-View</div>)
              .title("Details"),
          ])
      )
  ),
      // 7. Site Configuration
      S.listItem()
        .title("Site Configuration")
        .icon(Settings2)
        .child(
          S.list()
            .title("Site Configuration")
            .items([
              createSingleTon({ S, type: "navbar", title: "Navigation", icon: PanelTopDashedIcon }),
              createSingleTon({ S, type: "footer", title: "Footer", icon: PanelBottomIcon }),
              createSingleTon({ S, type: "settings", title: "Global Settings", icon: CogIcon }),
            ])
        ),
    ]);
};
