import { ComposeIcon, InsertAboveIcon, SearchIcon } from "@sanity/icons";
import { DEFAULT_SANITY_API_VERSION } from "@workspace/env/constants";
import type { FieldGroupDefinition } from "sanity";

export const GROUP = {
  SEO: "seo",
  MAIN_CONTENT: "main-content",
  OG: "og",
};

export const GROUPS: FieldGroupDefinition[] = [
  {
    name: GROUP.MAIN_CONTENT,
    icon: ComposeIcon,
    title: "Content",
    default: true,
  },
  { name: GROUP.SEO, icon: SearchIcon, title: "SEO" },
  {
    name: GROUP.OG,
    icon: InsertAboveIcon,
    title: "Open Graph",
  },
];

export const API_VERSION =
  process.env.SANITY_STUDIO_API_VERSION ?? DEFAULT_SANITY_API_VERSION;
