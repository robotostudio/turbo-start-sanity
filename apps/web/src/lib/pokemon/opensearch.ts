import { Client } from "@opensearch-project/opensearch";

import type { SearchablePokemon } from "@/lib/pokemon/types";

const INDEX_NAME = "pokemon";

function getClient() {
  return new Client({ node: process.env.OPENSEARCH_URL ?? "http://localhost:9200" });
}

export async function ensurePokemonIndex() {
  const client = getClient();
  const exists = await client.indices.exists({ index: INDEX_NAME });
  if (exists.body) return;

  await client.indices.create({
    index: INDEX_NAME,
    body: {
      settings: {
        analysis: {
          analyzer: {
            pokemon_analyzer: {
              type: "custom",
              tokenizer: "standard",
              filter: ["lowercase", "porter_stem"],
            },
          },
        },
      },
      mappings: {
        properties: {
          id: { type: "integer" },
          name: {
            type: "text",
            analyzer: "pokemon_analyzer",
            fields: { keyword: { type: "keyword" } },
          },
          types: { type: "keyword" },
          typesText: {
            type: "text",
            analyzer: "pokemon_analyzer",
          },
          officialArt: { type: "keyword", index: false },
        },
      },
    },
  });
}

export async function bulkReplacePokemon(pokemon: SearchablePokemon[]) {
  const client = getClient();
  await ensurePokemonIndex();

  if (pokemon.length === 0) return;

  const ops: Array<Record<string, unknown>> = [];
  for (const p of pokemon) {
    ops.push({ index: { _index: INDEX_NAME, _id: String(p.id) } });
    ops.push({
      id: p.id,
      name: p.name,
      types: p.types,
      typesText: p.typesText,
      officialArt: p.officialArt,
    });
  }

  await client.bulk({ refresh: true, body: ops });
}

export async function searchPokemon(
  query: string,
  limit = 10
): Promise<SearchablePokemon[]> {
  const client = getClient();
  await ensurePokemonIndex();

  const response = await client.search({
    index: INDEX_NAME,
    body: {
      size: limit,
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query,
                fields: ["name^3", "typesText^2"],
                fuzziness: "AUTO",
              },
            },
            { term: { types: query.toLowerCase() } },
          ],
          minimum_should_match: 1,
        },
      },
    },
  });

  return (
    response.body.hits.hits as Array<{ _source: SearchablePokemon }>
  ).map((h) => h._source);
}
