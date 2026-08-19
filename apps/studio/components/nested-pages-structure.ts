import { File, Folder } from "lucide-react";
import { friendlyWords } from "friendlier-words";
import { getPublishedId } from "sanity";
import type { ListItemBuilder, StructureBuilder } from "sanity/structure";

import { API_VERSION } from "@/utils/constant";
import { getTitleCase } from "@/utils/helper";

type DocumentData = {
  _id: string;
  title: string;
  slug: string;
};

type FolderNode = {
  title: string;
  path: string;
  count: number;
  documents: DocumentData[];
  children: Record<string, FolderNode>;
};

type StructureOptions = {
  depth?: number;
  parentPath?: string;
};

type SanityListItem = ListItemBuilder | ReturnType<StructureBuilder["divider"]>;

const DOCUMENTS_QUERY = `
  *[_type == $schemaType && defined(slug.current)] {
      _id,
      title,
      "slug": slug.current
    }
`;

// Drafts and published docs both come back from the query; collapse to one row.
const deduplicateDocuments = (documents: DocumentData[]): DocumentData[] => {
  const documentMap = new Map<string, DocumentData>();

  for (const doc of documents) {
    if (!(doc._id && doc.slug)) {
      continue;
    }

    const normalizedId = getPublishedId(doc._id);
    // Prefer the published version when both exist.
    if (!(documentMap.has(normalizedId) && doc._id.startsWith("drafts."))) {
      documentMap.set(normalizedId, {
        ...doc,
        _id: normalizedId,
      });
    }
  }

  return Array.from(documentMap.values());
};

// Each "/" in a slug becomes a folder level, so /a/b/c nests three deep.
const processDocumentIntoStructure = (
  doc: DocumentData,
  folderStructure: Record<string, FolderNode>
): void => {
  if (!doc.slug) {
    return;
  }

  const segments = doc.slug.split("/").filter(Boolean);
  if (segments.length === 0) {
    return;
  }

  const firstSegment = segments[0];

  if (!folderStructure[firstSegment]) {
    folderStructure[firstSegment] = {
      title: getTitleCase(firstSegment),
      path: firstSegment,
      count: 0,
      documents: [],
      children: {},
    };
  }

  folderStructure[firstSegment].count++;

  // A single segment means the doc lives directly at "/parent".
  if (segments.length === 1) {
    folderStructure[firstSegment].documents.push(doc);
    return;
  }

  let currentLevel = folderStructure[firstSegment].children;
  let currentPath = firstSegment;

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    currentPath = `${currentPath}/${segment}`;

    if (!currentLevel[segment]) {
      currentLevel[segment] = {
        title: getTitleCase(segment),
        path: currentPath,
        count: 0,
        documents: [],
        children: {},
      };
    }

    currentLevel[segment].count++;

    // The last segment is the document itself, not another folder.
    if (i === segments.length - 1) {
      currentLevel[segment].documents.push(doc);
    }

    currentLevel = currentLevel[segment].children;
  }
};

const buildFolderStructure = (
  documents: DocumentData[]
): Record<string, FolderNode> => {
  const folderStructure: Record<string, FolderNode> = {};

  for (const doc of documents) {
    processDocumentIntoStructure(doc, folderStructure);
  }

  return folderStructure;
};

// Case-insensitive alphabetical compare for deterministic ordering
const compareAlpha = (a: string, b: string): number =>
  a.localeCompare(b, undefined, { sensitivity: "base" });

const byDocumentTitle = (a: DocumentData, b: DocumentData): number =>
  compareAlpha(a.title || a.slug, b.title || b.slug);

// Studio requires stable, unique list item ids across the recursive tree.
const createUniqueId = (
  type: "folder" | "doc" | "main" | "single",
  parentPath: string,
  key: string,
  depth: number
): string => `${type}-${parentPath}${key}-${depth}`;

const createDocumentListItems = (
  S: StructureBuilder,
  documents: DocumentData[],
  schemaType: string,
  uniqueId: string
): ListItemBuilder[] =>
  documents.map((doc, docIndex) =>
    S.listItem()
      .id(`doc-${uniqueId}-${docIndex}`)
      .title(doc.title || "Untitled")
      .icon(File)
      .child(S.document().documentId(doc._id).schemaType(schemaType))
  );

// The page whose slug equals the folder path — shown as the folder's own page.
const createMainPageListItem = (
  S: StructureBuilder,
  mainPageDoc: DocumentData,
  schemaType: string,
  uniqueId: string
): ListItemBuilder =>
  S.listItem()
    .id(`main-${uniqueId}`)
    .title(mainPageDoc.title || "Untitled")
    .icon(Folder)
    .child(S.document().documentId(mainPageDoc._id).schemaType(schemaType));

// Folders get an "Add page" action pre-filled with a random child slug.
const createFolderListItem = (
  S: StructureBuilder,
  folder: FolderNode,
  uniqueId: string,
  listItems: SanityListItem[]
): ListItemBuilder => {
  const pageSlug = friendlyWords();
  const pageTitle = getTitleCase(pageSlug);

  return S.listItem()
    .id(uniqueId)
    .title(`${folder.title} (${folder.count})`)
    .icon(Folder)
    .child(
      S.list()
        .title(folder.title)
        .items(listItems)
        .menuItems([
          {
            title: "Add page",
            intent: {
              type: "create",
              params: [
                { type: "page", template: "nested-page-template" },
                {
                  slug: `/${folder.path}/${pageSlug}`,
                  title: `${folder.title} > ${pageTitle}`,
                },
              ],
            },
          },
        ])
    );
};

const createSingleDocumentListItem = (
  S: StructureBuilder,
  doc: DocumentData,
  schemaType: string
): ListItemBuilder =>
  S.listItem()
    .id(`single-${doc._id}`)
    .title(doc.title || "Untitled")
    .icon(File)
    .child(S.document().documentId(doc._id).schemaType(schemaType));

type FolderProcessConfig = {
  S: StructureBuilder;
  key: string;
  folder: FolderNode;
  depth: number;
  parentPath: string;
  schemaType: string;
  createListItemsFromStructure: (
    structure: Record<string, FolderNode>,
    options?: StructureOptions
  ) => SanityListItem[];
};

const processFolderItem = (config: FolderProcessConfig): ListItemBuilder => {
  const {
    S,
    key,
    folder,
    depth,
    parentPath,
    schemaType,
    createListItemsFromStructure,
  } = config;
  const uniqueId = createUniqueId("folder", parentPath, key, depth);

  const childFolderItems =
    Object.keys(folder.children).length > 0
      ? createListItemsFromStructure(folder.children, {
          depth: depth + 1,
          parentPath: `${key}-`,
        })
      : [];

  const listItems: SanityListItem[] = [];

  const mainPageDoc = folder.documents.find((doc) => doc.slug === folder.path);
  const otherDocs = folder.documents
    .filter((doc) => doc._id !== mainPageDoc?._id)
    .sort(byDocumentTitle);

  // Order: child pages, then sub-folders, then the folder's own page last,
  // separated by dividers only where both sides have content.
  if (otherDocs.length > 0) {
    listItems.push(
      ...createDocumentListItems(S, otherDocs, schemaType, uniqueId)
    );
  }

  if (childFolderItems.length > 0) {
    if (otherDocs.length > 0) {
      listItems.push(S.divider());
    }
    listItems.push(...childFolderItems);
  }

  if (mainPageDoc) {
    if (otherDocs.length > 0 || childFolderItems.length > 0) {
      listItems.push(S.divider());
    }
    listItems.push(
      createMainPageListItem(S, mainPageDoc, schemaType, uniqueId)
    );
  }

  return createFolderListItem(S, folder, uniqueId, listItems);
};

const combineItemsWithDividers = (
  S: StructureBuilder,
  folders: ListItemBuilder[],
  files: ListItemBuilder[]
): SanityListItem[] => {
  const result: SanityListItem[] = [];

  if (folders.length > 0) {
    result.push(...folders);
  }

  if (folders.length > 0 && files.length > 0) {
    result.push(S.divider());
  }

  if (files.length > 0) {
    result.push(...files);
  }

  return result;
};

/**
 * Creates a dynamic folder structure based on document slugs/paths
 */
export const createSlugBasedStructure = (
  S: StructureBuilder,
  schemaType: string
) => {
  if (!schemaType || typeof schemaType !== "string") {
    throw new Error("Schema type is required and must be a string");
  }

  return S.listItem()
    .title(`${getTitleCase(schemaType)}s by Path`)
    .icon(Folder)
    .child(async () => {
      try {
        const client = S.context.getClient({ apiVersion: API_VERSION });
        if (!client) {
          throw new Error("Unable to get Sanity client");
        }

        const documents = await client.fetch(DOCUMENTS_QUERY, { schemaType });
        const uniqueDocuments = deduplicateDocuments(documents);
        const folderStructure = buildFolderStructure(uniqueDocuments);

        const createListItemsFromStructure = (
          structure: Record<string, FolderNode>,
          options: StructureOptions = {}
        ): SanityListItem[] => {
          const { depth = 0, parentPath = "" } = options;
          const folders: ListItemBuilder[] = [];
          const looseDocs: DocumentData[] = [];

          // Sort by path segment so folders render alphabetically
          const sortedEntries = Object.entries(structure).sort(([a], [b]) =>
            compareAlpha(a, b)
          );

          for (const [key, folder] of sortedEntries) {
            const hasChildren = Object.keys(folder.children).length > 0;
            const hasDocuments = folder.documents.length > 0;
            const totalItems =
              Object.keys(folder.children).length + folder.documents.length;

            // A path only earns a folder once it holds more than one thing;
            // otherwise it renders as a plain page at this level.
            if (totalItems > 1 || hasChildren) {
              folders.push(
                processFolderItem({
                  S,
                  key,
                  folder,
                  depth,
                  parentPath,
                  schemaType,
                  createListItemsFromStructure,
                })
              );
            } else if (hasDocuments && folder.documents.length === 1) {
              looseDocs.push(folder.documents[0]);
            }
          }

          // Loose pages sort by title (slug fallback), below the folders
          looseDocs.sort(byDocumentTitle);
          const files = looseDocs.map((doc) =>
            createSingleDocumentListItem(S, doc, schemaType)
          );

          return combineItemsWithDividers(S, folders, files);
        };

        const allDocumentsItem = S.documentTypeListItem(schemaType)
          .id(`all-${schemaType}s-list`)
          .title(`All ${getTitleCase(schemaType)}s`);

        const dynamicItems = createListItemsFromStructure(folderStructure);

        return S.list()
          .title(`${getTitleCase(schemaType)}s`)
          .items([allDocumentsItem, S.divider(), ...(dynamicItems || [])]);
      } catch {
        // A failed fetch shouldn't blank the pane — fall back to the flat list.
        return S.list()
          .title(`${getTitleCase(schemaType)}s`)
          .items([
            S.documentTypeListItem(schemaType)
              .id(`fallback-${schemaType}s-list`)
              .title(`All ${getTitleCase(schemaType)}s`),
          ]);
      }
    });
};
