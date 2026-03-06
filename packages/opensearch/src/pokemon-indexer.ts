import { getOpenSearchClient } from "./client";
import {
  POKEMON_INDEX,
  POKEMON_INDEX_SETTINGS,
  type PokemonDocument,
} from "./pokemon-mapping";

export async function ensurePokemonIndex(options?: {
  forceRecreate?: boolean;
}): Promise<void> {
  const client = getOpenSearchClient();

  const { body: exists } = await client.indices.exists({
    index: POKEMON_INDEX,
  });

  if (exists && options?.forceRecreate) {
    await client.indices.delete({ index: POKEMON_INDEX });
  } else if (exists) {
    return;
  }

  await client.indices.create({
    index: POKEMON_INDEX,
    body: POKEMON_INDEX_SETTINGS,
  });
}

export async function indexPokemonDocument(
  doc: PokemonDocument,
): Promise<void> {
  const client = getOpenSearchClient();

  await client.index({
    index: POKEMON_INDEX,
    id: `pokemon-${doc.pokemonId}`,
    body: doc,
    refresh: "wait_for",
  });
}

export async function bulkIndexPokemonDocuments(
  docs: PokemonDocument[],
  options?: { batchSize?: number },
): Promise<{ indexed: number; errors: number }> {
  const client = getOpenSearchClient();
  const batchSize = options?.batchSize ?? 100;

  let indexed = 0;
  let errors = 0;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);

    const body = batch.flatMap((doc) => [
      { index: { _index: POKEMON_INDEX, _id: `pokemon-${doc.pokemonId}` } },
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
            `[opensearch] Failed to index pokemon ${item.index._id}:`,
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

export async function getPokemonIndexStats(): Promise<{
  documentCount: number;
  indexExists: boolean;
}> {
  const client = getOpenSearchClient();

  try {
    const { body: exists } = await client.indices.exists({
      index: POKEMON_INDEX,
    });

    if (!exists) {
      return { documentCount: 0, indexExists: false };
    }

    const { body: count } = await client.count({
      index: POKEMON_INDEX,
    });

    return { documentCount: count.count, indexExists: true };
  } catch {
    return { documentCount: 0, indexExists: false };
  }
}
