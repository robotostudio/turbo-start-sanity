export interface AlgoliaBlogPost {
  objectID: string; // Algolia requires this field
  _id: string;
  _type: 'blog';
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  authorName?: string;
  authorPosition?: string;
  imageUrl?: string;
  imageAlt?: string;
  content?: string; // Rich text content for search
  tags?: string[];
  _updatedAt: string;
}

export interface AlgoliaSearchResult {
  hits: AlgoliaBlogPost[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
  query: string;
}

export interface SearchFilters {
  query: string;
  page?: number;
  hitsPerPage?: number;
}

export interface SearchCache {
  [key: string]: {
    results: AlgoliaSearchResult;
    timestamp: number;
    expiresAt: number;
  };
}
