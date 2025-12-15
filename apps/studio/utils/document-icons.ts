import {
  CogIcon,
  DocumentIcon,
  HomeIcon,
  ImagesIcon,
  JsonIcon,
  ListIcon,
  UserIcon,
} from "@sanity/icons";
import type { LucideIcon } from "lucide-react";
import {
  File,
  MessageCircle,
  PanelBottom,
  PanelTop,
  TrendingUpDown,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { schemaIcon } from "./icon-wrapper";

/**
 * Document type icons configuration.
 * Maps document type names to their corresponding icon components.
 * Icons can be from @sanity/icons or lucide-react.
 *
 * For lucide-react icons used in schemas, use schemaIcon() wrapper.
 * For @sanity/icons, use directly.
 * For structure.ts, use LucideIcon type directly.
 */
export const DOCUMENT_ICONS: Record<
  string,
  ComponentType<SVGProps<SVGSVGElement>> | LucideIcon
> = {
  // Document types
  author: UserIcon,
  collection: ImagesIcon,
  faq: schemaIcon(MessageCircle),
  page: DocumentIcon,
  redirect: schemaIcon(TrendingUpDown),

  // Singleton types
  homePage: HomeIcon, // From @sanity/icons
  collectionIndex: ListIcon,
  settings: CogIcon, // From lucide-react (matches schema)
  navbar: PanelTop, // From lucide-react (matches schema)
  footer: PanelBottom, // From lucide-react (matches preview in schema)

  // Structure-only icons (used in structure.ts but not in schemas)
  // These are kept here for consistency
  developerTools: JsonIcon,
} as const;

/**
 * Get icon for a document type.
 * Returns the icon component for the given document type, or a default File icon.
 *
 * @param documentType - The document type name
 * @returns The icon component for the document type
 */
export function getDocumentIcon(
  documentType: string
): ComponentType<SVGProps<SVGSVGElement>> | LucideIcon {
  return DOCUMENT_ICONS[documentType] ?? File;
}

/**
 * Type-safe document icon getter for structure.ts.
 * Returns LucideIcon type for use in structure builder.
 *
 * @param documentType - The document type name
 * @returns The icon component as LucideIcon
 */
export function getStructureIcon(documentType: string): LucideIcon {
  const icon = DOCUMENT_ICONS[documentType] ?? File;
  return icon as LucideIcon;
}
