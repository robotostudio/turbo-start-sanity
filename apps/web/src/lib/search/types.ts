// Simple search types for blog posts
export interface BlogSearchResult {
  id: string;
  title: string;
  description?: string;
  excerpt?: string;
  slug: string;
  url: string;
  image?: {
    src: string;
    alt: string;
  };
  publishedAt?: string;
  author?: {
    name: string;
    image?: string;
  };
}

export interface BlogSearchResponse {
  results: BlogSearchResult[];
  total: number;
  query: string;
  processingTime?: number;
}

export interface BlogSearchOptions {
  query: string;
  limit?: number;
  offset?: number;
}
