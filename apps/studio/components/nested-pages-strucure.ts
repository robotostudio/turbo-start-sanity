import { DocumentIcon, FolderIcon } from "@sanity/icons";
import { uuid } from "@sanity/uuid";
import type { ListItemBuilder, StructureBuilder } from "sanity/structure";

// Helper function to title-case names
const getTitleCase = (name: string) => {
  const titleTemp = name.replace(/([A-Z])/g, " $1");
  return titleTemp.charAt(0).toUpperCase() + titleTemp.slice(1);
};

/**
 * Creates a dynamic folder structure based on document slugs/paths
 */
export const createSlugBasedStructure = (
  S: StructureBuilder,
  schemaType: string,
) => {
  return S.listItem()
    .title(`${getTitleCase(schemaType)}s by Path`)
    .icon(FolderIcon)
    .child(async () => {
      // 1. Get client from context
      const client = S.context.getClient({ apiVersion: "2023-06-21" });

      // 2. Query all documents with their _id, title and slug
      const documents = await client.fetch(`
          *[_type == "${schemaType}" && defined(slug.current)] {
            _id,
            title,
            "slug": slug.current
          }
        `);

      // Helper function to normalize document IDs (remove drafts. prefix)
      const normalizeId = (id: string) => id.replace(/^drafts\./, "");

      // Create a map to deduplicate documents with the same normalized ID
      const documentMap = new Map<
        string,
        { _id: string; title: string; slug: string }
      >();
      documents.forEach((doc: { _id: string; title: string; slug: string }) => {
        const normalizedId = normalizeId(doc._id);
        // Only keep one version of each document (prefer published)
        if (!documentMap.has(normalizedId) || !doc._id.startsWith("drafts.")) {
          documentMap.set(normalizedId, {
            ...doc,
            _id: normalizedId, // Store normalized ID
          });
        }
      });

      // Use the deduplicated documents
      const uniqueDocuments = Array.from(documentMap.values());

      // 3. Process documents to build a nested folder structure
      const folderStructure: Record<
        string,
        {
          title: string;
          path: string;
          count: number;
          documents: Array<{ _id: string; title: string; slug: string }>;
          children: Record<string, any>;
        }
      > = {};

      // Process each document to create a nested structure
      for (const doc of uniqueDocuments) {
        if (!doc.slug) continue;

        // Get path segments
        const segments = doc.slug.split("/").filter(Boolean);

        // Process documents with at least one segment
        if (segments.length > 0) {
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
          }
          // If we have multiple segments, handle nested structure
          else if (segments.length > 1) {
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
          }
        }
      }

      // 4. Convert the folder structure to list items recursively
      const createListItemsFromStructure = (
        structure: Record<
          string,
          {
            title: string;
            path: string;
            count: number;
            documents: Array<{ _id: string; title: string; slug: string }>;
            children: Record<string, any>;
          }
        >,
        depth: number = 0,
        parentPath: string = "",
      ) => {
        // Separate folders and individual files
        const folders: ListItemBuilder[] = [];
        const files: ListItemBuilder[] = [];

        // Process each item in the structure
        Object.entries(structure).forEach(([key, folder], index) => {
          const hasChildren = Object.keys(folder.children).length > 0;
          const hasDocuments = folder.documents.length > 0;
          const totalItems =
            Object.keys(folder.children).length + folder.documents.length;

          // Create unique IDs for each list item based on path and index
          // This avoids using document IDs directly for list items
          const uniqueId = `folder-${parentPath}${key}-${depth}-${index}`;

          // If this has multiple items or children, it's a folder
          if (totalItems > 1 || hasChildren) {
            // Process child folders
            const childFolderItems = hasChildren
              ? createListItemsFromStructure(
                  folder.children,
                  depth + 1,
                  `${key}-`,
                )
              : [];

            // Prepare list items with proper ordering
            const listItems = [];

            // Find the main page for this folder (exact path match)
            const mainPageDoc = folder.documents.find(
              (doc) => doc.slug === folder.path,
            );
            const mainPageId = mainPageDoc ? mainPageDoc._id : null;

            // Filter out all the remaining documents (those that are not the main parent)
            const otherDocs = folder.documents.filter(
              (doc) => doc._id !== mainPageId,
            );

            // 1. Add child documents first
            if (otherDocs.length > 0) {
              otherDocs.forEach((doc, docIndex) => {
                listItems.push(
                  S.listItem()
                    .id(`doc-${uniqueId}-${docIndex}`)
                    .title(doc.title)
                    .icon(DocumentIcon)
                    .child(
                      S.document().documentId(doc._id).schemaType(schemaType),
                    ),
                );
              });
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
                S.listItem()
                  .id(`main-${uniqueId}`)
                  .title(mainPageDoc.title)
                  .icon(FolderIcon)
                  .child(
                    S.document()
                      .documentId(mainPageDoc._id)
                      .schemaType(schemaType),
                  ),
              );
            }
            const pageUuid = uuid();
            console.log(
              "🚀 ~ createListItemsFromStructure ~ pageUuid:",
              folder,
            );
            // Create the folder item with the prepared list items
            folders.push(
              S.listItem()
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
                              slug: `/${folder.path}/${pageUuid}`,
                              title: `${folder.title} >  ${pageUuid}`,
                            },
                          ],
                        },
                      },
                    ]),
                ),
            );
          }
          // If it's a single document with no children, it's a file
          else if (hasDocuments && folder.documents.length === 1) {
            const doc = folder.documents[0];
            files.push(
              S.listItem()
                // Use a path-based unique ID instead of document ID
                .id(`single-${uniqueId}`)
                .title(doc.title || folder.title)
                .icon(DocumentIcon)
                .child(S.document().documentId(doc._id).schemaType(schemaType)),
            );
          }
        });

        // Combine folders and files
        const result = [];

        // Add folders first
        if (folders.length > 0) {
          result.push(...folders);
        }

        // Add divider between folders and files
        if (folders.length > 0 && files.length > 0) {
          result.push(S.divider());
        }

        // Add files
        if (files.length > 0) {
          result.push(...files);
        }

        return result;
      };

      // 5. Create the complete structure
      // First get all the items we need
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
    });
};
