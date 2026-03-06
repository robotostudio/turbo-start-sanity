export { getOpenSearchClient, isOpenSearchHealthy } from "./client";
export { opensearchEnv } from "./env";
export {
  bulkIndexBlogDocuments,
  clearIndex,
  deleteBlogDocument,
  ensureIndex,
  getIndexStats,
  indexBlogDocument,
} from "./indexer";
export { BLOG_INDEX, type BlogDocument, INDEX_SETTINGS } from "./mapping";
export {
  bulkIndexPokemonDocuments,
  ensurePokemonIndex,
  getPokemonIndexStats,
  indexPokemonDocument,
} from "./pokemon-indexer";
export {
  POKEMON_INDEX,
  POKEMON_INDEX_SETTINGS,
  type PokemonDocument,
} from "./pokemon-mapping";
export {
  searchUnified,
  searchUnifiedGraceful,
  unifiedSearchParamsSchema,
  type UnifiedSearchHit,
  type UnifiedSearchParams,
  type UnifiedSearchResult,
} from "./pokemon-search";
export {
  searchBlogs,
  searchBlogsGraceful,
  searchParamsSchema,
  type SearchParams,
  type SearchResult,
} from "./search";
