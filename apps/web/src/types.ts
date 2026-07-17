import type { FilterByType, Get } from "@sanity/codegen";
import type {
  QueryBlogIndexPageBlogsResult,
  QueryBlogSlugPageDataResult,
  QueryGlobalSeoSettingsResult,
  QueryHomePageDataResult,
  QueryNavbarDataResult,
  QueryShowcaseItemsResult,
  QueryShowcasePageDataResult,
} from "@workspace/sanity/types";

export type PageBuilderBlock = Get<
  QueryHomePageDataResult,
  "pageBuilder",
  number
>;

type PageBuilderBlockTypes = NonNullable<PageBuilderBlock>["_type"];

export type PagebuilderType<T extends PageBuilderBlockTypes> = FilterByType<
  NonNullable<PageBuilderBlock>,
  T
>;

export type SanityRichTextProps = Get<QueryBlogSlugPageDataResult, "richText">;

export type SanityRichTextBlock = FilterByType<
  NonNullable<NonNullable<SanityRichTextProps>[number]>,
  "block"
>;

export type Blog = Get<QueryBlogIndexPageBlogsResult, number>;

export type ShowcasePageData = QueryShowcasePageDataResult;

export type ShowcaseItemData = NonNullable<QueryShowcaseItemsResult>[number];

export type Maybe<T> = T | null | undefined;

export type NavigationData = {
  navbarData: QueryNavbarDataResult;
  settingsData: QueryGlobalSeoSettingsResult;
};

type NavColumn = Get<QueryNavbarDataResult, "columns", number>;

export type ColumnLink =
  Extract<NavColumn, { type: "column" }>["links"] extends Array<infer T>
    ? T
    : never;

export type MenuLinkProps = {
  name: string;
  href: string;
  description?: string;
  icon?: string | null;
  onClick?: () => void;
};
