import type { SanityClient } from "@sanity/client";
import { DocumentIcon, FolderIcon } from "@sanity/icons";
import { friendlyWords } from "friendlier-words";
import { getPublishedId } from "sanity";
import type { ListItemBuilder, StructureBuilder } from "sanity/structure";
import { getTitleCase } from "../utils/helper";

// Types for better type safety
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

// Type for Sanity list items (includes dividers)
type SanityListItem = ListItemBuilder | ReturnType<StructureBuilder["divider"]>;

// Helper function to fetch documents with error handling
const fetchDocuments = async (
  client: SanityClient,
  schemaType: string
): Promise<DocumentData[]> => {
  try {
    const documents = await client.fetch(`
      *[_type == "${schemaType}" && defined(slug.current)] {
        _id,
        title,
        "slug": slug.current
      }
    `);

    if (!Array.isArray(documents)) {
      throw new Error("Invalid documents response");
    }

    return documents;
  } catch (error) {
    // console.error(`Failed to fetch ${schemaType} documents:`, error);
    throw new Error(
      `Unable to load ${schemaType} documents. Please try again. ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

// Helper function to deduplicate documents
const deduplicateDocuments = (documents: DocumentData[]): DocumentData[] => {
  const documentMap = new Map<string, DocumentData>();

  for (const doc of documents) {
    if (!(doc._id && doc.slug)) {
      continue;
    }

    const normalizedId = getPublishedId(doc._id);
    // Only keep one version of each document (prefer published)
    if (!(documentMap.has(normalizedId) && doc._id.startsWith("drafts."))) {
      documentMap.set(normalizedId, {
        ...doc,
        _id: normalizedId, // Store normalized ID
      });
    }
  }

  return Array.from(documentMap.values());
};

// Helper function to process a single document into the folder structure
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

  // Create first-level folder if it doesn't exist
  if (!folderStructure[firstSegment]) {
    folderStructure[firstSegment] = {
      title: getTitleCase(firstSegment),
      path: firstSegment,
      count: 0,
      documents: [],
      children: {},
    };
  }

  // Increment the count for this path
  folderStructure[firstSegment].count++;

  // If this is exactly the first segment (i.e., "/parent")
  if (segments.length === 1) {
    folderStructure[firstSegment].documents.push(doc);
    return;
  }

  // Handle nested structure for multiple segments
  let currentLevel = folderStructure[firstSegment].children;
  let currentPath = firstSegment;

  // Process each segment after the first
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    currentPath = `${currentPath}/${segment}`;

    // Create this level if it doesn't exist
    if (!currentLevel[segment]) {
      currentLevel[segment] = {
        title: getTitleCase(segment),
        path: currentPath,
        count: 0,
        documents: [],
        children: {},
      };
    }

    // Increment count for this level
    currentLevel[segment].count++;

    // If this is the last segment, it's a document at this level
    if (i === segments.length - 1) {
      currentLevel[segment].documents.push(doc);
    }

    // Move to next level for the next iteration
    currentLevel = currentLevel[segment].children;
  }
};

// Helper function to build folder structure from documents
const buildFolderStructure = (
  documents: DocumentData[]
): Record<string, FolderNode> => {
  const folderStructure: Record<string, FolderNode> = {};

  for (const doc of documents) {
    processDocumentIntoStructure(doc, folderStructure);
  }

  return folderStructure;
};

// Helper function to create a unique ID for list items
const createUniqueId = (
  type: "folder" | "doc" | "main" | "single",
  parentPath: string,
  key: string,
  depth: number
): string => `${type}-${parentPath}${key}-${depth}`;

// Helper function to create document list items
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
      .icon(DocumentIcon)
      .child(S.document().documentId(doc._id).schemaType(schemaType))
  );

// Helper function to create main page list item
const createMainPageListItem = (
  S: StructureBuilder,
  mainPageDoc: DocumentData,
  schemaType: string,
  uniqueId: string
): ListItemBuilder =>
  S.listItem()
    .id(`main-${uniqueId}`)
    .title(mainPageDoc.title || "Untitled")
    .icon(FolderIcon)
    .child(S.document().documentId(mainPageDoc._id).schemaType(schemaType));

// Helper function to create folder list item with menu
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
    .icon(FolderIcon)
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

// Helper function to create single document list item
const createSingleDocumentListItem = (
  S: StructureBuilder,
  doc: DocumentData,
  schemaType: string
): ListItemBuilder =>
  S.listItem()
    .id(`single-${doc._id}`)
    .title(doc.title || "Untitled")
    .icon(DocumentIcon)
    .child(S.document().documentId(doc._id).schemaType(schemaType));

// Configuration type for processing folder items
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

// Helper function to process folder items
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

  // Process child folders recursively
  const childFolderItems =
    Object.keys(folder.children).length > 0
      ? createListItemsFromStructure(folder.children, {
          depth: depth + 1,
          parentPath: `${key}-`,
        })
      : [];

  // Prepare list items with proper ordering
  const listItems: SanityListItem[] = [];

  // Find the main page for this folder (exact path match)
  const mainPageDoc = folder.documents.find((doc) => doc.slug === folder.path);
  const otherDocs = folder.documents.filter(
    (doc) => doc._id !== mainPageDoc?._id
  );

  // 1. Add child documents first
  if (otherDocs.length > 0) {
    listItems.push(
      ...createDocumentListItems(S, otherDocs, schemaType, uniqueId)
    );
  }

  // 2. Add child folders
  if (childFolderItems.length > 0) {
    // Add divider if we already added child documents
    if (otherDocs.length > 0) {
      listItems.push(S.divider());
    }
    listItems.push(...childFolderItems);
  }

  // 3. Add the main page last (at the bottom) if it exists with a divider
  if (mainPageDoc) {
    // Add divider if we have other content above
    if (otherDocs.length > 0 || childFolderItems.length > 0) {
      listItems.push(S.divider());
    }
    listItems.push(
      createMainPageListItem(S, mainPageDoc, schemaType, uniqueId)
    );
  }

  return createFolderListItem(S, folder, uniqueId, listItems);
};

// Helper function to combine folders and files with dividers
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
    .icon(FolderIcon)
    .child(async () => {
      try {
        // 1. Get client from context with error handling
        const client = S.context.getClient({ apiVersion: "2023-06-21" });
        if (!client) {
          throw new Error("Unable to get Sanity client");
        }
        // 2. Fetch and process documents
        const documents = await fetchDocuments(client, schemaType);
        const uniqueDocuments = deduplicateDocuments(documents);

        // 3. Build folder structure
        const folderStructure = buildFolderStructure(uniqueDocuments);

        // 4. Convert the folder structure to list items recursively
        const createListItemsFromStructure = (
          structure: Record<string, FolderNode>,
          options: StructureOptions = {}
        ): SanityListItem[] => {
          const { depth = 0, parentPath = "" } = options;
          const folders: ListItemBuilder[] = [];
          const files: ListItemBuilder[] = [];

          // Process each item in the structure
          for (const [key, folder] of Object.entries(structure)) {
            const hasChildren = Object.keys(folder.children).length > 0;
            const hasDocuments = folder.documents.length > 0;
            const totalItems =
              Object.keys(folder.children).length + folder.documents.length;

            // If this has multiple items or children, it's a folder
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
            }
            // If it's a single document with no children, it's a file
            else if (hasDocuments && folder.documents.length === 1) {
              const doc = folder.documents[0];
              files.push(createSingleDocumentListItem(S, doc, schemaType));
            }
          }

          return combineItemsWithDividers(S, folders, files);
        };

        // 5. Create the complete structure
        const allDocumentsItem = S.documentTypeListItem(schemaType)
          .id(`all-${schemaType}s-list`)
          .title(`All ${getTitleCase(schemaType)}s`);

        // Process the dynamic items from the folder structure
        const dynamicItems = createListItemsFromStructure(folderStructure);

        // Build the complete list with all items
        return S.list()
          .title(`${getTitleCase(schemaType)}s`)
          .items([
            // Standard flat list of all pages
            allDocumentsItem,

            // Divider for visual separation
            S.divider(),

            // Add all the dynamically generated folder items
            ...(dynamicItems || []),
          ]);
      } catch {
        // Return a fallback structure with error information
        return S.list()
          .title(`${getTitleCase(schemaType)}s`)
          .items([
            // Fallback to standard document list when there's an error
            S.documentTypeListItem(schemaType)
              .id(`fallback-${schemaType}s-list`)
              .title(`All ${getTitleCase(schemaType)}s`),
          ]);
      }
    });
};
