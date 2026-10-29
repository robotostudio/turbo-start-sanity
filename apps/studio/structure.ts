import {
  BookMarked,
  Cog,
  File,
  FileText,
  House,
  type LucideIcon,
  MessageCircle,
  PanelBottom,
  PanelTop,
  Settings2,
  TrendingUpDown,
  User,
} from "lucide-react";
import type { StructureBuilder } from "sanity/structure";

import { createSlugBasedStructure } from "@/components/nested-pages-structure";
import type { SchemaType, SingletonType } from "@/schemaTypes/index";
import { getTitleCase } from "@/utils/helper";

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
};

const createIndexListWithDatedItems = ({ S, index, list }: CreateIndexList) => {
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
          S.listItem()
            .title(listTitle)
            .icon(list.icon ?? File)
            .child(
              S.documentTypeList(list.type)
                .title(listTitle)
                .defaultOrdering([{ field: "publishedAt", direction: "desc" }])
            ),
        ])
    );
};

export const structure = (S: StructureBuilder) =>
  S.list()
    .title("Content")
    .items([
      createSingleTon({ S, type: "homePage", icon: House }),
      S.divider(),
      createSlugBasedStructure(S, "page"),
      createIndexListWithDatedItems({
        S,
        index: { type: "blogIndex", icon: BookMarked },
        list: { type: "blog", title: "Blogs", icon: FileText },
      }),
      createList({
        S,
        type: "faq",
        title: "FAQs",
        icon: MessageCircle,
      }),
      createList({ S, type: "author", title: "Authors", icon: User }),
      createList({
        S,
        type: "redirect",
        title: "Redirects",
        icon: TrendingUpDown,
      }),
      S.divider(),
      S.listItem()
        .title("Site Configuration")
        .icon(Settings2)
        .child(
          S.list()
            .title("Site Configuration")
            .items([
              createSingleTon({
                S,
                type: "navbar",
                title: "Navigation",
                icon: PanelTop,
              }),
              createSingleTon({
                S,
                type: "footer",
                title: "Footer",
                icon: PanelBottom,
              }),
              createSingleTon({
                S,
                type: "settings",
                title: "Global Settings",
                icon: Cog,
              }),
            ])
        ),
    ]);
