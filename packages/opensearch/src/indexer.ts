import { getOpenSearchClient } from "./client";
import {
  BLOG_INDEX,
  INDEX_SETTINGS,
  type BlogDocument,
} from "./mapping";

export async function ensureIndex(options?: {
  forceRecreate?: boolean;
}): Promise<void> {
  const client = getOpenSearchClient();

  const { body: exists } = await client.indices.exists({
    index: BLOG_INDEX,
  });

  if (exists && options?.forceRecreate) {
    await client.indices.delete({ index: BLOG_INDEX });
  } else if (exists) {
    return;
  }

  await client.indices.create({
    index: BLOG_INDEX,
    body: INDEX_SETTINGS,
  });
}

export async function indexBlogDocument(doc: BlogDocument): Promise<void> {
  const client = getOpenSearchClient();

  await client.index({
    index: BLOG_INDEX,
    id: doc._id,
    body: doc,
    refresh: "wait_for", // Ensure the document is searchable immediately
  });
}

export async function deleteBlogDocument(documentId: string): Promise<void> {
  const client = getOpenSearchClient();

  try {
    await client.delete({
      index: BLOG_INDEX,
      id: documentId,
      refresh: "wait_for",
    });
  } catch (error: unknown) {
    // If the document doesn't exist, that's fine — idempotent delete
    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      (error as { statusCode: number }).statusCode === 404
    ) {
      return;
    }
    throw error;
  }
}

export async function bulkIndexBlogDocuments(
  docs: BlogDocument[],
  options?: { batchSize?: number },
): Promise<{ indexed: number; errors: number }> {
  const client = getOpenSearchClient();
  const batchSize = options?.batchSize ?? 100;

  let indexed = 0;
  let errors = 0;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);

    const body = batch.flatMap((doc) => [
      { index: { _index: BLOG_INDEX, _id: doc._id } },
      doc,
    ]);

    const { body: bulkResponse } = await client.bulk({
      body,
      refresh: i + batchSize >= docs.length ? "wait_for" : false,
    });

    if (bulkResponse.errors) {
      for (const item of bulkResponse.items) {
        if (item.index?.error) {
          errors++;
          console.error(
            `[opensearch] Failed to index ${item.index._id}:`,
            item.index.error,
          );
        } else {
          indexed++;
        }
      }
    } else {
      indexed += batch.length;
    }
  }

  return { indexed, errors };
}

export async function clearIndex(): Promise<void> {
  const client = getOpenSearchClient();

  try {
    await client.deleteByQuery({
      index: BLOG_INDEX,
      body: {
        query: {
          match_all: {},
        },
      },
      refresh: true,
    });
  } catch (error: unknown) {
    // If the index doesn't exist yet, nothing to clear
    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      (error as { statusCode: number }).statusCode === 404
    ) {
      return;
    }
    throw error;
  }
}

export async function getIndexStats(): Promise<{
  documentCount: number;
  indexExists: boolean;
}> {
  const client = getOpenSearchClient();

  try {
    const { body: exists } = await client.indices.exists({
      index: BLOG_INDEX,
    });

    if (!exists) {
      return { documentCount: 0, indexExists: false };
    }

    const { body: count } = await client.count({
      index: BLOG_INDEX,
    });

    return { documentCount: count.count, indexExists: true };
  } catch {
    return { documentCount: 0, indexExists: false };
  }
}
