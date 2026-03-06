import { z } from "zod/v4";
import { getOpenSearchClient, isOpenSearchHealthy } from "./client";
import { BLOG_INDEX, type BlogDocument } from "./mapping";
import {
  POKEMON_INDEX,
  type PokemonDocument,
} from "./pokemon-mapping";

export const unifiedSearchParamsSchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type UnifiedSearchParams = z.infer<typeof unifiedSearchParamsSchema>;

export type UnifiedSearchHit =
  | { _index: "blog"; data: BlogDocument }
  | { _index: "pokemon"; data: PokemonDocument };

export type UnifiedSearchResult = {
  hits: UnifiedSearchHit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function searchUnified(
  params: UnifiedSearchParams,
): Promise<UnifiedSearchResult> {
  const client = getOpenSearchClient();
  const { q, page, limit } = params;

  const searchBody = {
    from: (page - 1) * limit,
    size: limit,
    query: {
      bool: {
        should: [
          {
            multi_match: {
              query: q,
              fields: [
                "title^3",
                "description^2",
                "authorName",
              ],
              type: "best_fields",
              fuzziness: "AUTO",
              prefix_length: 1,
            },
          },
          {
            multi_match: {
              query: q,
              fields: [
                "name^3",
                "types^2",
                "genus",
                "flavorText",
              ],
              type: "best_fields",
              fuzziness: "AUTO",
              prefix_length: 1,
            },
          },
          {
            multi_match: {
              query: q,
              fields: [
                "title.autocomplete",
                "name.autocomplete",
              ],
              type: "best_fields",
            },
          },
        ],
        minimum_should_match: 1,
      },
    },
    highlight: {
      fields: {
        title: { number_of_fragments: 0 },
        description: { number_of_fragments: 1, fragment_size: 200 },
        name: { number_of_fragments: 0 },
        flavorText: { number_of_fragments: 1, fragment_size: 200 },
      },
      pre_tags: ["<mark>"],
      post_tags: ["</mark>"],
    },
    sort: ["_score"],
  };

  const { body } = await client.search({
    index: [BLOG_INDEX, POKEMON_INDEX].join(","),
    body: searchBody,
  });

  const total =
    typeof body.hits.total === "number"
      ? body.hits.total
      : body.hits.total?.value ?? 0;

  const hits: UnifiedSearchHit[] = body.hits.hits.map(
    (hit: {
      _index: string;
      _source: BlogDocument | PokemonDocument;
      highlight?: Record<string, string[]>;
    }) => {
      if (hit._index.startsWith(POKEMON_INDEX) || hit._index === POKEMON_INDEX) {
        return {
          _index: "pokemon" as const,
          data: {
            ...hit._source,
            ...(hit.highlight && { _highlight: hit.highlight }),
          } as PokemonDocument,
        };
      }
      return {
        _index: "blog" as const,
        data: {
          ...hit._source,
          ...(hit.highlight && { _highlight: hit.highlight }),
        } as BlogDocument,
      };
    },
  );

  return {
    hits,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function searchUnifiedGraceful(
  params: UnifiedSearchParams,
): Promise<UnifiedSearchResult | null> {
  try {
    const healthy = await isOpenSearchHealthy();
    if (!healthy) return null;
    return await searchUnified(params);
  } catch (error) {
    console.error("[opensearch] Unified search failed:", error);
    return null;
  }
}
