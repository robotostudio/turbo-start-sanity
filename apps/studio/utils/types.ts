import type {
  ObjectDefinition,
  ObjectOptions,
  ObjectSchemaType,
  SlugDefinition,
  SlugOptions,
} from "sanity";
import type {
  NavigatorOptions as PresentationNavigatorOptions,
  PresentationPluginOptions,
} from "sanity/presentation";

export type NormalizedCreatablePage = {
  title: string;
  type: string;
};

export type PagesNavigatorOptions = {
  creatablePages?: NormalizedCreatablePage[];
};

export type PagesNavigatorPluginOptions = PresentationPluginOptions & {
  navigator?: Pick<PresentationNavigatorOptions, "maxWidth" | "minWidth">;
  creatablePages?: Array<NormalizedCreatablePage | string>;
  title?: string;
};

export type Page = {
  _rev: string;
  _id: string;
  _originalId: string;
  _type: Exclude<"string", "folder">;
  _updatedAt: string;
  _createdAt: string;
  slug: string | null;
  children: Record<string, unknown>;
};

export type PageTreeNode = Page & {
  title: string;
  edited?: boolean;
};

export type FolderTreeNode = Omit<Page, "_type"> & {
  _type: "folder";
  title: string;
  children: Tree;
};

export type Tree = Record<string, TreeNode>;

export type TreeNode = PageTreeNode | FolderTreeNode;

export type NavigatorContextType = {
  rootTree: Tree;
  currentDir: string;
  setCurrentDir: (dir: string) => void;
  searchTerm: string;
  handleSearch: (value: string) => void;
  locale?: string;
  defaultLocaleId?: string;
  setLocale?: (value: string) => void;
  items: TreeNode[];
};

export type HeaderProps = {
  children?: React.ReactNode;
  locales?: string[];
  domRef?: React.RefObject<HTMLDivElement>;
  pages?: NormalizedCreatablePage[];
};

export type ListItemProps = {
  item: TreeNode;
  active?: string;
  setActive?: (value: string) => void;
  idx?: number;
  virtualChild?: Record<string, unknown>;
};

export type SkeletonListItemsProps = {
  items: number;
};

export type LocaleProps = {
  domRef?: React.RefObject<HTMLDivElement>;
};

export type ReducerAction = {
  type: string;
  payload?: unknown;
};

export interface SectionOptions extends ObjectOptions {
  variants?: SectionVariant[];
}

/**
 * Pass any of the properties of Sanity object types described here: https://www.sanity.io/docs/object-type
 *
 * The `custom` property is strictly typed to include what the toolkit needs for scaffolding the website & studio.
 */
export interface SectionSchema extends Omit<ObjectDefinition, "options"> {
  options: SectionOptions;
}

export type SectionVariant = {
  /**
   * URl to an image, video or GIF that shows what this block variant looks like.
   */
  assetUrl: string;
  /**
   * What shows in the block selector in the editor.
   */
  title?: string;
  /**
   * What initial value to use for this variant when creating the block.
   *
   * @example
   * {
   *  title: "Title Centered, dark background",
   *  initialValue: { centeredTitle: true, bg: "dark" }
   * }
   */
  initialValue?: Record<string, unknown>;
};

export type SectionType = ObjectSchemaType & {
  options: SectionOptions;
};

export type SectionVariantType = {
  sectionName: string;
  title: string;
  assetUrl?: string;
  initialValue?: Record<string, unknown>;
};

export type SectionAddHandler = (params: {
  sectionName: string;
  initialValue?: Record<string, unknown>;
}) => void;

export type PathnameOptions = SlugOptions & {
  i18n?: {
    enabled?: boolean;
    defaultLocaleId?: string;
  };
};

export type PathnameParams = Omit<
  SlugDefinition,
  "type" | "options" | "name"
> & {
  name?: string;
  options?: PathnameOptions;
};
